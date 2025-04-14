// middleware/auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User'); 

dotenv.config();

const protect = async (req, res, next) => {
  let token;

  // 1. Request header'larından token'ı oku (Authorization: Bearer TOKEN)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ı 'Bearer ' kısmından ayır
      token = req.headers.authorization.split(' ')[1];

      // 2. Token'ı doğrula (verify)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Token geçerliyse, payload'daki kullanıcı ID'sini al
      //    ve kullanıcı bilgisini (şifre hariç) req objesine ekle.
      //    Bu sayede sonraki route handler'ları req.user'a erişebilir.
      //    User.findById yapıp kullanıcı nesnesini eklemek daha kullanışlı olabilir.
      req.user = await User.findById(decoded.user.id).select('-password');

      if (!req.user) {
          // Token geçerli ama kullanıcı veritabanında yoksa (silinmiş olabilir)
          return res.status(401).json({ msg: 'Bu tokena sahip kullanıcı bulunamadı.' });
      }

      next(); // Token geçerli, sonraki middleware veya route handler'a geç
    } catch (error) {
      // Token doğrulama başarısız olursa (geçersiz, süresi dolmuş vb.)
      console.error('Token doğrulama hatası:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Geçersiz token, yetkilendirme reddedildi.' });
      } else if (error.name === 'TokenExpiredError') {
         return res.status(401).json({ msg: 'Token süresi dolmuş, lütfen tekrar giriş yapın.' });
      }
       return res.status(401).json({ msg: 'Token geçerli değil.' });
    }
  }

  // 4. Eğer header'da 'Bearer' token yoksa
  if (!token) {
    return res.status(401).json({ msg: 'Token bulunamadı, yetkilendirme reddedildi.' });
  }
};

module.exports = { protect }; // Middleware'i export et