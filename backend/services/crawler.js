const axios = require('axios');
const cheerio = require('cheerio');
const Page = require('../models/Page');
const Queue = require('../models/Queue');
const CrawlStats = require('../models/CrawlStats');

const MAX_DEPTH = 2;

class CrawlerService {
  constructor() {
    this.isRunning = false;
  }

  async addSeed(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      const exists = await Queue.findOne({ url: urlStr });
      if (!exists) {
        await Queue.create({
          url: urlStr,
          domain: urlObj.hostname,
          status: 'pending',
          depth: 0
        });
        await this.incrementStats(0, 1);
      }
      if (!this.isRunning) {
        this.startCrawling();
      }
    } catch (err) {
      console.error('Invalid seed URL:', urlStr);
    }
  }

  async incrementStats(crawledDelta, queuedDelta) {
    const today = new Date().toISOString().split('T')[0];
    await CrawlStats.findOneAndUpdate(
      { date: today },
      { $inc: { crawledCount: crawledDelta, queuedCount: queuedDelta } },
      { upsert: true }
    );
  }

  async startCrawling() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Worker ${process.pid}] Crawler loop started`);

    while (this.isRunning) {
      const job = await Queue.findOneAndUpdate(
        { status: 'pending' },
        { status: 'crawling' },
        { returnDocument: 'after', sort: { addedAt: 1 } }
      );

      if (!job) {
        console.log(`[Worker ${process.pid}] Queue empty. Crawler sleeping...`);
        this.isRunning = false;
        break;
      }

      try {
        console.log(`[Worker ${process.pid}] Crawling: ${job.url} (Depth: ${job.depth})`);

        const response = await axios.get(job.url, { timeout: 10000 });
        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('title').text() || 'No Title';
        const content = $('body').text().replace(/\s+/g, ' ').trim();
        
        const outlinks = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('http')) {
            outlinks.push(href);
          }
        });

        // Save Page
        await Page.findOneAndUpdate(
          { url: job.url },
          { domain: job.domain, title, content, outlinks },
          { upsert: true }
        );

        // Update Job Status
        job.status = 'completed';
        await job.save();

        let newQueued = 0;
        // Enqueue outlinks if within depth limit
        if (job.depth < MAX_DEPTH) {
          for (let link of outlinks) {
            try {
              const linkObj = new URL(link);
              const inQueue = await Queue.exists({ url: link });
              if (!inQueue) {
                await Queue.create({
                  url: link,
                  domain: linkObj.hostname,
                  status: 'pending',
                  depth: job.depth + 1
                });
                newQueued++;
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        }

        // Update stats
        await this.incrementStats(1, newQueued - 1); // -1 because we completed 1 job
        
        // Politeness delay removed to ensure high speed crawling

      } catch (err) {
        console.error(`[Worker ${process.pid}] Failed to crawl ${job.url}:`, err.message);
        job.status = 'failed';
        await job.save();
        await this.incrementStats(0, -1); // -1 queued, 0 crawled
      }
    }
  }
}

module.exports = new CrawlerService();
