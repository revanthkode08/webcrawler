const IndexedPage = require('../models/IndexedPage.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.getAiSummary = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ summary: '' });

    // Fetch top 3 results to pass as context
    const topResults = await IndexedPage.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' }, snippet: 1, title: 1 }
    ).sort({ score: { $meta: 'textScore' } }).limit(3).lean();

    let context = '';
    if (topResults.length > 0) {
      context = "Here are some relevant excerpts from our database related to the user's query:\n" + 
        topResults.map(r => `Title: ${r.title}\nExcerpt: ${r.snippet}`).join('\n\n');
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ summary: 'AI summary is disabled because the Gemini API key is missing.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a helpful AI search assistant for a web crawler search engine. A user has searched for "${q}". \n\n${context}\n\nPlease provide a very brief (2-3 sentences), helpful summary or AI overview related to this search query based on the context provided. Provide general helpful knowledge if the context is insufficient. Keep it concise, friendly, and do not use markdown code blocks. Make it read like Google's AI Overview.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    res.json({ summary: text });
  } catch (err) {
    console.error('AI Summary Error:', err);
    res.status(500).json({ error: 'Failed to generate AI summary' });
  }
};

exports.publicSearch = async (req, res, next) => {
  try {
    const { q: Query, page = 1, limit = 10, domain = '', category = '', sort = 'relevance' } = req.query;
    if (!Query) return res.json({ results: [], totalPages: 0, currentPage: 1, totalResults: 0 });

    const skip = (page - 1) * limit;
    let queryObj = {};
    let projection = {};
    let sortOption = {};

    try {
      queryObj.$text = { $search: Query };
      projection = { score: { $meta: 'textScore' } };
      sortOption = sort === 'relevance' ? { score: { $meta: 'textScore' } } : sort === 'date' ? { indexedAt: -1 } : { score: { $meta: 'textScore' } };
    } catch(e) {
      queryObj.$or = [
        { title: { $regex: Query, $options: 'i' } },
        { snippet: { $regex: Query, $options: 'i' } },
        { Keywords: { $regex: Query, $options: 'i' } },
        { SemanticSearchTags: { $regex: Query, $options: 'i' } }
      ];
      sortOption = { indexedAt: -1 };
    }

    if (domain) queryObj.domain = { $regex: domain, $options: 'i' };
    if (category) queryObj.CompanyCategory = { $in: [new RegExp(category, 'i')] };

    const [Pages, total] = await Promise.all([
      IndexedPage.find(queryObj, projection).sort(sortOption).skip(skip).limit(parseInt(limit)).lean(),
      IndexedPage.countDocuments(queryObj)
    ]);

    const domains = [...new Set(Pages.map(p => p.domain).filter(Boolean))];
    const categories = [...new Set(Pages.flatMap(p => p.CompanyCategory || []).filter(Boolean))];

    // Format matches for frontend expectations
    const data = Pages.map(r => ({
      ...r,
      Title: r.title,
      Url: r.url,
      Domain: r.domain,
      Description: r.snippet
    }));

    return res.json({
      results: data,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalResults: total,
      availableDomains: domains,
      availableCategories: categories
    });
  } catch (err) { next(err); }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const { q: Query } = req.query;
    if (!Query || Query.trim().length < 2) return res.json([]);
    const q = Query.trim().toLowerCase();

    const [domainMatches, keywordMatches, tagMatches, titleMatches, entityMatches] = await Promise.all([
      IndexedPage.aggregate([
        { $match: { domain: { $regex: `^${q}`, $options: 'i' } } },
        { $group: { _id: '$domain', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]),
      IndexedPage.aggregate([
        { $match: { Keywords: { $regex: `^${q}`, $options: 'i' } } },
        { $unwind: '$Keywords' },
        { $match: { Keywords: { $regex: `^${q}`, $options: 'i' } } },
        { $group: { _id: '$Keywords', count: { $sum: 1 }, domains: { $addToSet: '$domain' } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      IndexedPage.aggregate([
        { $match: { SemanticSearchTags: { $regex: `^${q}`, $options: 'i' } } },
        { $unwind: '$SemanticSearchTags' },
        { $match: { SemanticSearchTags: { $regex: `^${q}`, $options: 'i' } } },
        { $group: { _id: '$SemanticSearchTags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 4 }
      ]),
      IndexedPage.find({ title: { $regex: q, $options: 'i' } }, { title: 1, domain: 1 }).limit(4).lean(),
      IndexedPage.aggregate([
        { $match: {
            $or: [
              { 'NamedEntities.technologies': { $regex: `^${q}`, $options: 'i' } },
              { 'NamedEntities.companies':    { $regex: `^${q}`, $options: 'i' } },
              { 'NamedEntities.products':     { $regex: `^${q}`, $options: 'i' } }
            ]
        }},
        { $limit: 3 },
        { $project: { NamedEntities: 1, domain: 1, _id: 0 } }
      ])
    ]);

    const suggestions = [];
    const seen = new Set();
    const addSuggestion = (text, type, meta = {}) => {
      if (!text) return;
      const key = text.toLowerCase();
      if (!seen.has(key) && suggestions.length < 8) {
        seen.add(key);
        suggestions.push({ text, type, ...meta });
      }
    };

    domainMatches.forEach(d => { addSuggestion(d._id, 'domain', { count: d.count, domain: d._id }); });
    keywordMatches.forEach(k => { addSuggestion(k._id, 'keyword', { count: k.count, domain: k.domains?.[0] }); });
    tagMatches.forEach(t => { addSuggestion(t._id, 'semantic', { count: t.count }); });
    entityMatches.forEach(p => {
      const es = [...(p.NamedEntities?.technologies||[]), ...(p.NamedEntities?.companies||[]), ...(p.NamedEntities?.products||[])];
      es.forEach(e => { if (e && e.toLowerCase().startsWith(q)) addSuggestion(e, 'entity', { domain: p.domain }); });
    });
    titleMatches.forEach(p => { addSuggestion(p.title, 'title', { domain: p.domain }); });
    
    res.json(suggestions);
  } catch (err) { next(err); }
};

exports.getRelatedSearches = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) return res.json([]);

    const pages = await IndexedPage.find({ $text: { $search: q } }, { score: { $meta: 'textScore' }, Keywords: 1, SemanticSearchTags: 1 })
      .sort({ score: { $meta: 'textScore' } }).limit(5).lean();

    const allKeywords = pages.flatMap(p => [...(p.Keywords || []), ...(p.SemanticSearchTags || [])]);
    const queryWords = q.toLowerCase().split(' ');
    const freq = {};
    allKeywords.forEach(k => {
      if (!k) return;
      const kl = k.toLowerCase();
      if (!queryWords.some(qw => kl.includes(qw))) {
        freq[k] = (freq[k] || 0) + 1;
      }
    });

    const related = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, parseInt(limit)).map(([t])=>t);
    res.json(related);
  } catch (err) { next(err); }
};

exports.getTrendingKeywords = async (req, res, next) => {
  try {
    const trending = await IndexedPage.aggregate([
      { $unwind: '$Keywords' },
      { $group: { _id: '$Keywords', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { keyword: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(trending);
  } catch(err) { next(err); }
};

exports.getPublicStats = async (req, res, next) => {
  try {
    const totalPages = await IndexedPage.countDocuments();
    const domainAgs = await IndexedPage.aggregate([
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalDomains = domainAgs.length;
    const topDomains = domainAgs.slice(0, 5).map(d => ({ domain: d._id, count: d.count }));
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPages = await IndexedPage.countDocuments({ indexedAt: { $gte: oneDayAgo } });
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const historyAgs = await IndexedPage.aggregate([
      { $match: { indexedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%m/%d", date: "$indexedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const dailyHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const mmdd = `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
      const found = historyAgs.find(h => h._id === mmdd);
      dailyHistory.push({ date: mmdd, count: found ? found.count : 0 });
    }

    res.json({ totalPages, totalDomains, topDomains, recentPages, dailyHistory });
  } catch (err) { next(err); }
};
exports.getTrendingDomains = async (req, res, next) => {
  res.json([]);
};

exports.getDomainPages = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const { page = 1, sort = 'date' } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const sortOption = sort === 'words' ? { wordCount: -1 } : { indexedAt: -1 };

    const [data, total, statsAggr] = await Promise.all([
      IndexedPage.find({ domain }).sort(sortOption).skip(skip).limit(limit).lean(),
      IndexedPage.countDocuments({ domain }),
      IndexedPage.aggregate([
        { $match: { domain } },
        { $group: { _id: null, avgWords: { $avg: "$wordCount" }, firstIndexed: { $min: "$indexedAt" } } }
      ])
    ]);

    const stats = statsAggr[0] || {};
    res.json({ data, total, stats });
  } catch (err) { next(err); }
};

exports.getPageDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }
    const page = await IndexedPage.findById(id).lean();
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const related = await IndexedPage.find({ domain: page.domain, _id: { $ne: id } })
      .select('title url domain')
      .limit(5)
      .lean();

    res.json({ page, related });
  } catch (err) { next(err); }
};
