const IndexedPage = require('../models/IndexedPage.model');

exports.getIndexedPages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, domain } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};
    let projection = {};
    let sortOption = { indexedAt: -1 };

    // Domain filter
    if (domain && domain.trim()) {
      query.domain = domain.trim();
    }

    // Text search if provided
    if (search && search.trim().length >= 2) {
      query.$text = { $search: search.trim() };
      projection = { score: { $meta: 'textScore' } };
      sortOption = { score: { $meta: 'textScore' } };
    }

    const [data, total] = await Promise.all([
      IndexedPage.find(query, projection)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      IndexedPage.countDocuments(query)
    ]);

    return res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      data
    });

  } catch (err) {
    // TEXT INDEX MISSING — fall back to regex search gracefully
    if (
      err.message?.includes('text index') ||
      err.code === 27 ||
      err.codeName === 'IndexNotFound'
    ) {
      try {
        const { page = 1, limit = 20, search, domain } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const regexQuery = {};

        if (domain?.trim()) {
          regexQuery.domain = domain.trim();
        }

        if (search?.trim()) {
          regexQuery.$or = [
            { title:  { $regex: search.trim(), $options: 'i' } },
            { url:    { $regex: search.trim(), $options: 'i' } },
            { domain: { $regex: search.trim(), $options: 'i' } }
          ];
        }

        const [data, total] = await Promise.all([
          IndexedPage.find(regexQuery)
            .sort({ indexedAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
          IndexedPage.countDocuments(regexQuery)
        ]);

        // Tell frontend which mode was used
        return res.json({
          total,
          page: Number(page),
          limit: Number(limit),
          data,
          fallback: true,
          warning: 'Text index unavailable. Using basic search.'
        });

      } catch (fallbackErr) {
        return next(fallbackErr);
      }
    }

    next(err);
  }
};
