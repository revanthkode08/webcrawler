const mongoose = require('mongoose');

const indexedPageSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  title: { type: String, default: 'Untitled' },
  domain: { type: String, required: true, trim: true },
  wordCount: { type: Number, default: 0 },
  crawlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crawl' },
  indexedAt: { type: Date, default: Date.now },
  snippet: { type: String, default: '' },
  parentUrl: { type: String, default: null },
  depth: { type: Number, default: 0 },
  Keywords: { type: [String], default: [] },
  SemanticSearchTags: { type: [String], default: [] },
  CompanyCategory: { type: [String], default: [] },
  NamedEntities: { 
    companies: [String], technologies: [String], products: [String], locations: [String] 
  },
  RelevanceScores: { 
    technical: Number, job: Number, internship: Number, business: Number 
  },
  WebsitePurpose: { type: String, default: "" },
  rawText: { type: String, default: "" }
});

indexedPageSchema.index(
  { title: 'text', url: 'text', domain: 'text' },
  { name: 'search_text_index' }
);

module.exports = mongoose.model('IndexedPage', indexedPageSchema);
