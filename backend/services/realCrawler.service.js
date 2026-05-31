const puppeteer = require('puppeteer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Crawl = require('../models/Crawl.model');
const QueueItem = require('../models/QueueItem.model');
const IndexedPage = require('../models/IndexedPage.model');
const logger = require('./logger.service');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

const extractionSchema = `
Extract the following information from the text and return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks.
{
  "Keywords": ["keyword1", "keyword2"],
  "SemanticSearchTags": ["tag1", "tag2"],
  "CompanyCategory": ["category1"],
  "NamedEntities": {
    "companies": [],
    "technologies": [],
    "products": [],
    "locations": []
  },
  "RelevanceScores": {
    "technical": 0,
    "job": 0,
    "internship": 0,
    "business": 0
  },
  "WebsitePurpose": "purpose description"
}`;

class RealCrawlerService {
  constructor() {
    this.isRunning = false;
    this.browser = null;
    this.activeWorkers = 0;
    this.fastWorkers = 0;
    // FIX 3: Initialize counter for browser recycling
    this.pagesProcessedSinceLaunch = 0; 
    
    // FIX 6: Add named timer properties so they can be explicitly cleared
    this._fastPollTimer = null;
    this._puppeteerPollTimer = null;
  }

  // FIX 3: Extracted launchBrowser method to recycle Chrome and clear memory
  async launchBrowser() {
    if (this.browser) {
      try { await this.browser.close(); } catch (e) {}
    }
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    this.pagesProcessedSinceLaunch = 0; // Reset counter
    logger.info('Puppeteer browser instance launched/recycled');
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Starting Dual Crawler Service (Fast Axios + Slow Puppeteer)...');
    try {
      await this.launchBrowser();
      this.scheduleFastPoll();
      this.schedulePuppeteerPoll();
    } catch (err) {
      logger.error('Failed to launch Puppeteer:', err);
      this.isRunning = false;
    }
  }

  async stop() {
    this.isRunning = false;
    
    // FIX 6: Clear timers when stopped so they don't keep firing
    if (this._fastPollTimer) clearTimeout(this._fastPollTimer);
    if (this._puppeteerPollTimer) clearTimeout(this._puppeteerPollTimer);

    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    logger.warn('Crawler Service stopped.');
  }

  // FIX 6: Use named timers instead of anonymous setTimeout
  scheduleFastPoll(delay = 100) {
    this._fastPollTimer = setTimeout(() => this.pollFastQueue(), delay);
  }

  // FIX 6: Use named timers instead of anonymous setTimeout
  schedulePuppeteerPoll(delay = 500) {
    this._puppeteerPollTimer = setTimeout(() => this.pollPuppeteerQueue(), delay);
  }

  async pollFastQueue() {
    if (!this.isRunning) return;

    // FIX 7: Reduced concurrency from 30 to 5 to prevent CPU overload and allow Node-Cron to execute
    if (this.fastWorkers >= 5) {
      this.scheduleFastPoll(500);
      return;
    }

    try {
      const item = await QueueItem.findOneAndUpdate(
        { status: 'pending' },
        { status: 'processing' },
        { returnDocument: 'after', sort: { priority: -1, createdAt: 1 } }
      );

      if (!item) {
        this.scheduleFastPoll(1000);
        return;
      }

      this.fastWorkers++;
      this.processFastItem(item).finally(() => {
        this.fastWorkers--;
        this.scheduleFastPoll(100);
      });

      this.scheduleFastPoll(100);
    } catch (err) {
      logger.error('Fast queue poll error:', err.message);
      this.scheduleFastPoll(5000);
    }
  }

  async processFastItem(item) {
    try {
      // FIX 8: Added .lean() to the initial read query for memory efficiency
      const crawl = await Crawl.findById(item.crawlId).lean();
      if (!crawl) {
        item.status = 'failed';
        await item.save();
        return;
      }

      if (crawl.status === 'queued') {
        await Crawl.findByIdAndUpdate(item.crawlId, {
          status: 'running',
          startedAt: new Date()
        });
      }

      logger.info(`Fast crawling: ${item.url}`);

      const response = await axios.get(item.url, {
        timeout: 10000,
        // FIX 9: Enforce 5MB limit on Axios responses to prevent large page OOM crashes
        maxContentLength: 5 * 1024 * 1024, 
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const title = $('title').text() || item.domain;
      
      // FIX 10: Immediately truncate Cheerio content string to 5000 chars before anything else
      const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
      
      const snippet = content.substring(0, 300);
      const rawText = content.substring(0, 1500);
      const wordCount = content.split(' ').length;

      await IndexedPage.findOneAndUpdate(
        { url: item.url },
        {
          title,
          domain: item.domain,
          wordCount,
          crawlId: item.crawlId,
          snippet,
          rawText,
          parentUrl: item.parentUrl || null,
          depth: item.depth || 0,
          Keywords: [],
          SemanticSearchTags: ['pending_ai'],
          indexedAt: new Date()
        },
        { upsert: true }
      );

      if (crawl.pages < crawl.maxPages) {
        const outlinks = [];
        $('a').each((i, el) => {
          if (outlinks.length >= 15) return false;
          const href = $(el).attr('href');
          if (href && href.startsWith('http')) outlinks.push(href);
        });

        const uniqueLinks = [...new Set(outlinks)].slice(0, 10);
        let added = 0;
        for (const link of uniqueLinks) {
          if (added >= 3) break;
          try {
            const urlObj = new URL(link);
            const exists = await QueueItem.exists({ url: link });
            if (!exists) {
              await QueueItem.create({
                url: link,
                domain: urlObj.hostname,
                priority: 0,
                status: 'pending',
                crawlId: crawl._id,
                parentUrl: item.url,
                depth: (item.depth || 0) + 1
              });
              added++;
            }
          } catch (e) {}
        }
      }

      // FIX 8: Replaced read-modify-save with atomic $inc update to prevent race conditions on crawl.pages
      await Crawl.findByIdAndUpdate(item.crawlId, {
        $inc: { pages: 1 },
        $set: {
          elapsed: crawl.startedAt ? Math.floor((Date.now() - new Date(crawl.startedAt).getTime()) / 1000) : 0
        }
      });

      item.status = 'completed';
      await item.save();

    } catch (err) {
      item.status = 'failed';
      await item.save();
    }
  }

  async pollPuppeteerQueue() {
    if (!this.isRunning) return;

    // FIX 7: Reduced concurrency from 10 to 2 to prevent CPU overload and allow Node-Cron to execute
    if (this.activeWorkers >= 2) {
      this.schedulePuppeteerPoll(1000);
      return;
    }

    try {
      const pageToProcess = await IndexedPage.findOneAndUpdate(
        { SemanticSearchTags: 'pending_ai' },
        { $set: { SemanticSearchTags: ['processing_ai'] } },
        { returnDocument: 'after', sort: { indexedAt: -1 } }
      );

      if (!pageToProcess) {
        this.schedulePuppeteerPoll(1000);
        return;
      }

      this.activeWorkers++;
      this.processPuppeteerItem(pageToProcess).finally(() => {
        this.activeWorkers--;
        
        // FIX 3: Increment counter and recycle browser if 50 pages processed
        this.pagesProcessedSinceLaunch++;
        if (this.pagesProcessedSinceLaunch >= 50) {
          logger.info(`Recycling browser after ${this.pagesProcessedSinceLaunch} pages processed...`);
          this.launchBrowser().catch(err => logger.error('Browser recycle failed:', err));
        }

        this.schedulePuppeteerPoll(200);
      });

      this.schedulePuppeteerPoll(200);
    } catch (err) {
      logger.error('Error in Puppeteer poller:', err);
      this.schedulePuppeteerPoll(5000);
    }
  }

  async processPuppeteerItem(indexedPage) {
    let page = null;
    try {
      if (!this.browser) return;

      page = await this.browser.newPage();

      // FIX 5: Abort expensive resource types to save memory
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) NutchFlow/1.0 AI');
      await page.setViewport({ width: 1280, height: 800 });

      logger.info(`Puppeteer extracting keywords for: ${indexedPage.url}`);

      const response = await page.goto(indexedPage.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (!response || (!response.ok() && response.status() !== 304)) {
        throw new Error(`HTTP Status ${response?.status()}`);
      }

      const content = await page.evaluate(() => {
        const body = document.body;
        return body ? body.innerText.replace(/\s+/g, ' ').trim().substring(0, 4000) : '';
      });

      // FIX 4: Call page.close() IMMEDIATELY after extracting text, before waiting 5-10s for Gemini API
      await page.close().catch(() => {});
      page = null; // Set to null so the finally block doesn't double-close

      let extracted = {
        Keywords: ['processed_no_keywords'],
        SemanticSearchTags: ['processed'],
        CompanyCategory: [],
        NamedEntities: {},
        RelevanceScores: {},
        WebsitePurpose: ''
      };

      if (model && content.length > 50) {
        try {
          const prompt = `Text content:\n${content}\n\n${extractionSchema}`;
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          let jsonStr = responseText;
          if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0];
          else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1];
          extracted = JSON.parse(jsonStr.trim());
          logger.success(`Gemini AI successfully extracted from: ${indexedPage.url}`);
        } catch (geminiErr) {
          logger.error(`Gemini extraction failed for ${indexedPage.url}`);
          extracted.Keywords = ['tech', 'startup', indexedPage.domain, 'fallback'];
          extracted.SemanticSearchTags = ['processed_fallback'];
        }
      } else {
        extracted.Keywords = [indexedPage.domain, 'website', 'mock_ai'];
        extracted.SemanticSearchTags = ['processed_mock'];
      }

      await IndexedPage.findByIdAndUpdate(indexedPage._id, {
        Keywords: extracted.Keywords || ['processed_fallback'],
        SemanticSearchTags: extracted.SemanticSearchTags || ['processed'],
        CompanyCategory: extracted.CompanyCategory || [],
        NamedEntities: extracted.NamedEntities || {},
        RelevanceScores: extracted.RelevanceScores || {},
        WebsitePurpose: extracted.WebsitePurpose || ''
      });

    } catch (err) {
      logger.error(`Puppeteer failed on ${indexedPage.url}: ${err.message}`);
      await IndexedPage.findByIdAndUpdate(indexedPage._id, { SemanticSearchTags: ['failed_ai'] });
    } finally {
      // FIX 4: Ensure page closes if it failed before the early close, skip if already closed
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }
}

module.exports = new RealCrawlerService();
