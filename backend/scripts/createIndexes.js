const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutchflow');
  const db = mongoose.connection.db;
  const col = db.collection('indexedpages');

  // Drop any broken existing text index
  try {
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (idx.key && Object.values(idx.key).includes('text')) {
        await col.dropIndex(idx.name);
        console.log(`Dropped old index: ${idx.name}`);
      }
    }
  } catch (e) {
    console.log('No old text index found, continuing...');
  }

  // Create fresh text index
  await col.createIndex(
    { title: 'text', url: 'text', domain: 'text' },
    { name: 'search_text_index' }
  );

  console.log('✓ Text index created successfully on indexedpages');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
