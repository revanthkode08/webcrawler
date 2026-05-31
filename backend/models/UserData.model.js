const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  bookmarks: [{
    pageId:    { type: mongoose.Schema.Types.ObjectId, ref: 'IndexedPage' },
    url:       String,
    title:     String,
    domain:    String,
    savedAt:   { type: Date, default: Date.now }
  }],
  savedSearches: [{
    query:     String,
    resultCount: Number,
    searchedAt: { type: Date, default: Date.now }
  }],
  searchHistory: [{
    query:     String,
    searchedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('UserData', userDataSchema);
