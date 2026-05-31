const mongoose = require('mongoose');
const User = require('./models/User.model');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const email = 'kode22@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} NOT FOUND in database!`);
    } else {
      console.log(`User ${email} found:`, user.username);
      // We can't know the exact password, but we can verify it exists
      console.log('Password hash present:', !!user.password);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
