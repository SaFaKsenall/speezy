const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,         
      useUnifiedTopology: true,   
    });

    console.log('MongoDB Bağlantısı Başarılı...');
  } catch (err) {
    console.error('MongoDB Bağlantı Hatası:', err.message);
    process.exit(1); // Uygulamadan çıkış yap (hata kodu 1 ile)
  }
};

module.exports = connectDB;
