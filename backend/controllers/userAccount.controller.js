const UserData = require('../models/UserData.model');

exports.getAccount = async (req, res, next) => {
  try {
    let userData = await UserData.findOne({ userId: req.user.id })
      .populate('bookmarks.pageId', 'url title domain wordCount indexedAt');
    if (!userData) {
      userData = await UserData.create({ userId: req.user.id });
    }
    res.json(userData);
  } catch (err) { next(err); }
};

exports.addBookmark = async (req, res, next) => {
  try {
    const { pageId, url, title, domain } = req.body;
    const userData = await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { $addToSet: { bookmarks: { pageId, url, title, domain } } },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ message: 'Bookmarked!', bookmarks: userData.bookmarks });
  } catch (err) { next(err); }
};

exports.removeBookmark = async (req, res, next) => {
  try {
    await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { bookmarks: { pageId: req.params.pageId } } }
    );
    res.json({ message: 'Bookmark removed.' });
  } catch (err) { next(err); }
};

exports.saveSearch = async (req, res, next) => {
  try {
    const { query, resultCount } = req.body;
    
    // Check if empty query to avoid pushing empty objects
    if (!query) return res.json({ message: 'Ok' });

    await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $push: { 
          savedSearches: { $each: [{ query, resultCount }], $position: 0 },
          searchHistory: { $each: [{ query }], $position: 0, $slice: 50 }
        }
      },
      { upsert: true }
    );
    res.json({ message: 'Search saved.' });
  } catch (err) { next(err); }
};

exports.removeSavedSearch = async (req, res, next) => {
  try {
    await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { savedSearches: { _id: req.params.id } } }
    );
    res.json({ message: 'Saved search removed.' });
  } catch (err) { next(err); }
};

exports.clearHistory = async (req, res, next) => {
  try {
    await UserData.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { searchHistory: [] } }
    );
    res.json({ message: 'History cleared.' });
  } catch (err) { next(err); }
};
