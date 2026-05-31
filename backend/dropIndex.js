const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nutchflow')
  .then(async () => {
    try {
      await mongoose.connection.collection('indexedpages').dropIndex('url_1');
      console.log('Dropped unique url_1 index from indexedpages collection');
    } catch (err) {
      console.log('Index url_1 not found or already dropped:', err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  });
