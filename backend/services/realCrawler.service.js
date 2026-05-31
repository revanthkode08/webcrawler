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

// JSON Schema for Gemini
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
    this.activeWorkers = 0; // For Puppeteer
    this.fastWorkers = 0; // For Axios
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Starting Dual Crawler Service (Fast Axios + Slow Puppeteer)...');
    
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      // Start both pollers
      this.pollFastQueue();
      this.pollPuppeteerQueue();
    } catch (err) {
      logger.error('Failed to launch Puppeteer:', err);
      this.isRunning = false;
    }
  }

  async stop() {
    this.isRunning = false;
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    logger.warn('Crawler Service stopped.');
  }

  async pollFastQueue() {
    if (!this.isRunning) return;
    if (this.fastWorkers >= 10) { // Run 10 fast requests concurrently
      setTimeout(() => this.pollFastQueue(), 1000);
      return;
    }

    try {
      const item = await QueueItem.findOneAndUpdate(
        { status: 'pending' },
        { status: 'processing' },
        { returnDocument: 'after', sort: { priority: -1, createdAt: 1 } }
      );

      if (!item) {
        setTimeout(() => this.pollFastQueue(), 2000);
        return;
      }

      this.fastWorkers++;
      this.processFastItem(item).finally(() => {
        this.fastWorkers--;
        setTimeout(() => this.pollFastQueue(), 50);
      });

      // Spawn next worker queue quickly
      setTimeout(() => this.pollFastQueue(), 100);

    } catch (err) {
      setTimeout(() => this.pollFastQueue(), 5000);
    }
  }

  async processFastItem(item) {
    try {
      const crawl = await Crawl.findById(item.crawlId);
      if (crawl && crawl.status === 'queued') {
        crawl.status = 'running';
        crawl.startedAt = new Date();
        await crawl.save();
      }

      logger.info(`Fast crawling: ${item.url}`);
      
      const response = await axios.get(item.url, { timeout: 10000 });
      const html = response.data;
      const $ = cheerio.load(html);

      const title = $('title').text() || item.domain;
      const content = $('body').text().replace(/\s+/g, ' ').trim();
      
      const snippet = content.substring(0, 300);
      const rawText = content.substring(0, 1500) + '...';
      const wordCount = content.split(' ').length;

      // Upsert into IndexedPage quickly
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
          Keywords: [], // Blank initially
          SemanticSearchTags: ['pending_ai'], // For Puppeteer to fetch
          indexedAt: new Date()
        },
        { upsert: true, returnDocument: 'after' }
      );

      // Extract outlinks
      if (crawl && crawl.pages < crawl.maxPages) {
        const outlinks = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('http')) outlinks.push(href);
        });

        const uniqueLinks = [...new Set(outlinks)];
        let added = 0;
        for (const link of uniqueLinks.slice(0, 15)) {
          if (added >= 5) break; 
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
          } catch(e) {}
        }
      }

      if (crawl) {
        crawl.pages += 1;
        if (crawl.startedAt) {
          crawl.elapsed = Math.floor((new Date() - crawl.startedAt) / 1000);
        }
        await crawl.save();
      }

      item.status = 'completed';
      await item.save();

    } catch (err) {
      item.status = 'failed';
      await item.save();

      // Ensure elapsed updates on failure to prevent stalling graph
      const failCrawl = await Crawl.findById(item.crawlId);
      if (failCrawl && failCrawl.startedAt) {
        failCrawl.elapsed = Math.floor((new Date() - failCrawl.startedAt) / 1000);
        await failCrawl.save();
      }
    }
  }

  async pollPuppeteerQueue() {
    if (!this.isRunning) return;
    if (this.activeWorkers >= 3) {
      setTimeout(() => this.pollPuppeteerQueue(), 3000);
      return;
    }

    try {
      // Find a parsed page that hasn't had Keywords extracted
      const pageToProcess = await IndexedPage.findOneAndUpdate(
        { SemanticSearchTags: 'pending_ai' },
        { $set: { SemanticSearchTags: ['processing_ai'] } },
        { returnDocument: 'after', sort: { indexedAt: -1 } }
      );

      if (!pageToProcess) {
        setTimeout(() => this.pollPuppeteerQueue(), 3000);
        return;
      }

      this.activeWorkers++;
      this.processPuppeteerItem(pageToProcess).finally(() => {
        this.activeWorkers--;
        setTimeout(() => this.pollPuppeteerQueue(), 100);
      });

      setTimeout(() => this.pollPuppeteerQueue(), 500);

    } catch (err) {
      logger.error('Error in Puppeteer poller:', err);
      setTimeout(() => this.pollPuppeteerQueue(), 5000);
    }
  }

  async processPuppeteerItem(indexedPage) {
    let page = null;
    try {
      if (!this.browser) return;

      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) NutchFlow/1.0 AI');
      await page.setViewport({ width: 1280, height: 800 });

      logger.info(`Puppeteer extracting keywords for: ${indexedPage.url}`);
      
      const response = await page.goto(indexedPage.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || (!response.ok() && response.status() !== 304)) {
        throw new Error(`HTTP Status ${response?.status()}`);
      }

      const content = await page.evaluate(() => {
        const body = document.body;
        return body ? body.innerText.replace(/\\s+/g, ' ').trim() : '';
      });

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
          const prompt = `Text content:\n${content.substring(0, 4000)}\n\n${extractionSchema}`;
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          let jsonStr = responseText;
          if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.split('```json')[1].split('```')[0];
          } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.split('```')[1];
          }
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
      await IndexedPage.findByIdAndUpdate(indexedPage._id, {
        SemanticSearchTags: ['failed_ai']
      });
    } finally {
      if (page) {
        await page.close().catch(()=>null);
      }
    }
  }
}

module.exports = new RealCrawlerService();
