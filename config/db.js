const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const connectDB = async () => {
  try {
    // MongoDB Atlas'a bağlanmayı dene
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,         // Yeni URL ayrıştırıcısını kullan
      useUnifiedTopology: true,    // Yeni Sunucu Keşfi ve İzleme motorunu kullan
      // Mongoose 6 ve sonrası için aşağıdaki ikisi varsayılan olarak true gelir,
      // useCreateIndex: true,       // mongoose.ensureIndex yerine createIndex kullan (deprecate oldu)
      // useFindAndModify: false   // findOneAndUpdate() vb. için altta yatan MongoDB sürücüsünün findOneAndUpdate() kullanmasını sağlar (deprecate oldu)
    });

    console.log('MongoDB Bağlantısı Başarılı...');
  } catch (err) {
    // Bağlantı hatası olursa hatayı yazdır ve uygulamayı sonlandır
    console.error('MongoDB Bağlantı Hatası:', err.message);
    process.exit(1); // Uygulamadan çıkış yap (hata kodu 1 ile)
  }
};

// Bağlantı fonksiyonunu dışa aktar
module.exports = connectDB;