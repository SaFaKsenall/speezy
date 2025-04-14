const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs'); // Şifre karşılaştırma için import ediyoruz
const jwt = require('jsonwebtoken'); // JWT oluşturmak için import ediyoruz
const dotenv = require('dotenv'); // .env değişkenlerini okumak için
const nodemailer = require('nodemailer'); 
const crypto = require('crypto'); // <<<--- BU SATIRI EKLEYİN

// .env değişkenlerini yükle (JWT_SECRET için gerekli)
dotenv.config();






// Yeni kullanıcı kaydı fonksiyonu (Mevcut fonksiyonunuz)
exports.registerUser = async (req, res) => {
    // ... (registerUser kodunuz burada - değişiklik yok)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'Bu e-posta adresi zaten kullanımda.' }] });
        }
        user = new User({
            username,
            email,
            password,
        });
        await user.save();
        res.status(201).json({ msg: 'Kullanıcı başarıyla kaydedildi.', userId: user.id });
    } catch (err) {
        console.error('Kayıt sırasında hata:', err.message);
        res.status(500).send('Sunucu Hatası');
    }
};






// --- YENİ LOGIN FONKSİYONU ---
exports.loginUser = async (req, res) => {
  // 1. Gelen istekteki doğrulama hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Eğer doğrulama hataları varsa, 400 Bad Request hatası döndür
    return res.status(400).json({ errors: errors.array() });
  }

  // 2. İstek body'sinden e-posta ve şifreyi al
  const { email, password } = req.body;

  try {
    // 3. Veritabanında kullanıcıyı e-posta ile bulmaya çalış
    // ÖNEMLİ: .select('+password') ekleyerek, şemada select:false olmasına rağmen şifreyi sorguya dahil ediyoruz.
    let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // 4. Kullanıcı bulunamadıysa veya şifre seçilemediyse hata döndür
    if (!user) {
      // Güvenlik notu: "Kullanıcı bulunamadı" demek yerine genel bir hata vermek daha iyidir
      // Bu, hangi e-postaların kayıtlı olduğunu tahmin etmeyi zorlaştırır.
      return res.status(400).json({ errors: [{ msg: 'Geçersiz kimlik bilgileri.' }] });
    }

    // 5. Gelen şifre ile veritabanındaki hashlenmiş şifreyi karşılaştır
    const isMatch = await bcrypt.compare(password, user.password);

    // 6. Şifreler eşleşmiyorsa hata döndür
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Geçersiz kimlik bilgileri.' }] });
    }
    // 7. Şifreler eşleşti! JWT Oluştur
    // Token içeriği (payload): Genellikle kullanıcı ID'si gibi benzersiz ve hassas olmayan bilgiler konur.
    const payload = {
      user: {
        id: user.id,
        // İsterseniz buraya rol gibi başka bilgiler de ekleyebilirsiniz (ama şifre asla!)
      },
    };

    // Token'ı imzala (payload, gizli anahtar, seçenekler)
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // .env dosyasından aldığımız gizli anahtar
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }, // .env'den alınan veya varsayılan geçerlilik süresi
      (err, token) => {
        if (err) throw err; // Eğer token oluşturulurken hata olursa
        // 8. Başarılı yanıtı ve oluşturulan token'ı gönder
        res.status(200).json({ token }); // 200 OK status kodu
      }
    );

  } catch (err) {
    // 9. Beklenmedik bir sunucu hatası olursa logla ve 500 hatası döndür
    console.error('Giriş sırasında hata:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};







// --- YENİ FORGOT PASSWORD FONKSİYONU ---
exports.forgotPassword = async (req, res) => {
  // 1. Gelen e-postayı doğrula
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // 2. Kullanıcıyı bul
    const user = await User.findOne({ email: email.toLowerCase() });

    // 3. Kullanıcı yoksa BİLE başarılı mesajı döndür (güvenlik)
    if (!user) {
      // Not: Kullanıcı bulunamasa bile, e-postanın sistemde kayıtlı olup olmadığını
      // belli etmemek için yine de başarılı bir mesaj döndürmek iyi bir pratiktir.
      console.log(`Şifre sıfırlama isteği (bulunamadı): ${email}`);
      return res.status(200).json({ msg: 'Eğer e-posta adresiniz sistemimizde kayıtlıysa, şifre sıfırlama talimatları gönderilecektir.' });
    }

    // 4. 6 Haneli OTP Oluştur
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '10') * 60 * 1000); // Dakikayı milisaniyeye çevir

    // 5. OTP ve son kullanma tarihini veritabanına kaydet
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = otpExpires;
    await user.save(); // Değişiklikleri kaydet

    // 6. E-posta Gönderme İşlemi
    try {
      // Nodemailer transporter oluştur
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // örn: 'gmail'
        auth: {
          user: process.env.EMAIL_USERNAME, // örn: sizinepostanız@gmail.com
          pass: process.env.EMAIL_PASSWORD, // Google Uygulama Şifreniz
        },
        // Gmail için daha az güvenli uygulamalara izin vermek gerekebilir,
        // ancak Uygulama Şifresi kullanmak daha güvenlidir.
        // tls: { rejectUnauthorized: false } // Bazı durumlarda gerekebilir, dikkatli kullanın
      });

       // Güzel HTML E-posta Şablonu
       const emailHtml = `
       <!DOCTYPE html>
       <html lang="tr">
       <head>
           <meta charset="UTF-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>Şifre Sıfırlama Kodu</title>
           <style>
               body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
               .container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
               .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
               .header h1 { color: #007bff; margin: 0; }
               .content p { margin-bottom: 15px; }
               .otp-code {
                   display: inline-block;
                   font-size: 28px;
                   font-weight: bold;
                   color: #28a745;
                   background-color: #e9f5ec;
                   padding: 10px 20px;
                   border-radius: 5px;
                   letter-spacing: 3px;
                   margin: 15px 0;
               }
               .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px;}
               .footer p { margin: 5px 0; }
           </style>
       </head>
       <body>
           <div class="container">
               <div class="header">
                   <h1>Şifre Sıfırlama İsteği</h1>
               </div>
               <div class="content">
                   <p>Merhaba ${user.name},</p>
                   <p>Hesabınız için şifre sıfırlama isteğinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki tek kullanımlık kodu (OTP) kullanabilirsiniz:</p>
                   <p style="text-align: center;">
                       <span class="otp-code">${otp}</span>
                   </p>
                   <p>Bu kod, <strong>${process.env.OTP_EXPIRES_IN_MINUTES || '10'} dakika</strong> içinde geçerliliğini yitirecektir.</p>
                   <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Hesabınız güvende kalacaktır.</p>
               </div>
               <div class="footer">
                   <p>© ${new Date().getFullYear()} Uygulama Adınız. Tüm hakları saklıdır.</p>
                   <p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
               </div>
           </div>
       </body>
       </html>
       `;

      // E-posta seçenekleri
      const mailOptions = {
        from: process.env.EMAIL_FROM, // Gönderen adresi (örn: '"Uygulama Adı" <mail@site.com>')
        to: user.email,              // Alıcı adresi (kullanıcının e-postası)
        subject: 'Şifre Sıfırlama Kodunuz', // E-posta konusu
        html: emailHtml,            // HTML içerik
        // text: `Şifre sıfırlama kodunuz: ${otp}` // HTML desteklemeyen istemciler için text versiyonu (isteğe bağlı)
      };

      // E-postayı gönder
      await transporter.sendMail(mailOptions);
      console.log(`Şifre sıfırlama e-postası gönderildi: ${user.email}, OTP: ${otp}`);

      // Kullanıcıya başarılı yanıtı gönder
      res.status(200).json({ msg: 'Eğer e-posta adresiniz sistemimizde kayıtlıysa, şifre sıfırlama talimatları gönderilecektir.' });

    } catch (mailError) {
      // E-posta gönderirken hata olursa
      console.error('E-posta gönderme hatası:', mailError);
      // Kullanıcıdan OTP ve süresini temizle, çünkü e-posta gitmedi
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      // Genel sunucu hatası döndür
      return res.status(500).json({ msg: 'E-posta gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' });
    }

  } catch (err) {
    console.error('Forgot Password Hatası:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

// --- YENİ RESET PASSWORD FONKSİYONU ---
exports.resetPassword = async (req, res) => {
  // 1. Gelen verileri doğrula
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp, newPassword } = req.body;

  try {
    // 2. Kullanıcıyı e-posta, OTP ve OTP süresinin dolmamış olması şartıyla bul
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() }, // Sürenin hala geçerli olup olmadığını kontrol et ($gt = greater than)
    });

    // 3. Kullanıcı bulunamazsa (geçersiz/süresi dolmuş OTP veya yanlış e-posta)
    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Geçersiz veya süresi dolmuş OTP kodu.' }] });
    }

    // 4. Yeni şifreyi ayarla (pre-save hook hashleyecek)
    user.password = newPassword;

    // 5. OTP ve son kullanma tarihi alanlarını temizle
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    // 6. Kullanıcıyı güncelle (şifre hashlenerek kaydedilecek)
    await user.save();

    console.log(`Şifre başarıyla sıfırlandı: ${user.email}`);
    // 7. Başarılı yanıtı gönder
    res.status(200).json({ msg: 'Şifreniz başarıyla güncellendi.' });

  } catch (err) {
    console.error('Reset Password Hatası:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};





// --- YENİ GET ME FONKSİYONU ---
// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  // Middleware (protect) sayesinde req.user objesi zaten mevcut ve doğrulanmış olmalı.
  // Middleware ayrıca kullanıcıyı veritabanından şifre hariç alıp req.user'a atadı.

  try {
    // Eğer middleware kullanıcıyı req.user'a eklemeseydi, burada tekrar bulmamız gerekirdi:
    // const user = await User.findById(req.user.id).select('-password');
    // Ama middleware bunu zaten yaptığı için doğrudan req.user'ı gönderebiliriz.

    if (!req.user) {
        // Bu durumun olmaması gerekir ama ekstra kontrol
        return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
    }

    // Kullanıcı bilgilerini (şifre hariç) yanıt olarak gönder
    res.status(200).json(req.user);

  } catch (err) {
    console.error('Get Me Hatası:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};
// --- YENİ GET ME FONKSİYONU SONU ---






// --- E-POSTA DEĞİŞİKLİĞİ KONTROLCÜLERİ ---

// Aşama 1: Değişikliği Başlat (Eski E-postaya OTP)
exports.initiateEmailChange = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { newEmail } = req.body;
  const userId = req.user.id;
  const currentEmail = req.user.email;
  const newEmailLower = newEmail.toLowerCase();

  try {
    if (newEmailLower === currentEmail) return res.status(400).json({ errors: [{ msg: 'Yeni e-posta mevcutla aynı olamaz.' }] });
    const emailExists = await User.findOne({ email: newEmailLower });
    if (emailExists) return res.status(400).json({ errors: [{ msg: 'Bu e-posta adresi zaten kullanılıyor.' }] });

    const user = await User.findById(userId); // Kullanıcıyı al
    if (!user) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' }); // Olmamalı

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + (parseInt(process.env.EMAIL_CHANGE_OTP_EXPIRES_IN_MINUTES || '10') * 60 * 1000);

    // Aşama 1 OTP, süre ve YENİ EPOSTAYI kaydet
    user.changeEmailOtp = otp;
    user.changeEmailOtpExpires = otpExpires;
    user.newEmailAddress = newEmailLower;
    // Aşama 2 alanlarını temizle (önceki denemeden kalmış olabilir)
    user.verifyNewEmailToken = undefined;
    user.verifyNewEmailExpires = undefined;
    await user.save();

    // E-posta gönderme (Mevcut/Eski E-postaya)
    try {
      const transporter = nodemailer.createTransport({   service: process.env.EMAIL_SERVICE, // örn: 'gmail'
        auth: {
          user: process.env.EMAIL_USERNAME, // örn: sizinepostanız@gmail.com
          pass: process.env.EMAIL_PASSWORD, // Google Uygulama Şifreniz
        },
        // Gmail için daha az güvenli uygulamalara izin vermek gerekebilir,
        // ancak Uygulama Şifresi kullanmak daha güvenlidir.
        // tls: { rejectUnauthorized: false } // Bazı durumlarda gerekebilir, dikkatli kullanın 
        });
      const emailHtml = `... (E-posta Değişikliği Onay Kodu: ${otp}) ...`; // Eski e-postaya gidecek HTML
      const mailOptions = { from: process.env.EMAIL_FROM, to: currentEmail, subject: 'E-posta Değişiklik Talebi Onayı', html: emailHtml };
      await transporter.sendMail(mailOptions);
      console.log(`Aşama 1 OTP gönderildi: ${currentEmail}, OTP: ${otp}`);
      res.status(200).json({ msg: `E-posta değişiklik talebinizi onaylamak için mevcut e-posta adresinize (${currentEmail}) bir kod gönderildi.` });
    } catch (mailError) {
      console.error('Aşama 1 OTP gönderme hatası:', mailError);
      user.changeEmailOtp = undefined; user.changeEmailOtpExpires = undefined; user.newEmailAddress = undefined; await user.save();
      return res.status(500).json({ msg: 'Onay e-postası gönderilirken bir hata oluştu.' });
    }
  } catch (err) {
    console.error('Initiate Email Change Hatası:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

// Aşama 2: Eski E-postadaki OTP'yi Doğrula, Yeni E-postaya Token Gönder
exports.verifyEmailChangeRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { otp, newEmail } = req.body;
  const userId = req.user.id;
  const newEmailLower = newEmail.toLowerCase();

  try {
    // Kullanıcıyı ID ile bul ve Aşama 1 bilgilerini kontrol et
    const user = await User.findById(userId);

    if (!user || user.changeEmailOtp !== otp || user.newEmailAddress !== newEmailLower || !user.changeEmailOtpExpires || user.changeEmailOtpExpires < Date.now()) {
      return res.status(400).json({ errors: [{ msg: 'Geçersiz veya süresi dolmuş onay kodu ya da eşleşmeyen e-posta.' }] });
    }

    // Aşama 1 Başarılı! Şimdi Aşama 2 için token üret ve YENİ E-POSTAYA gönder

    // Güvenli, rastgele bir token üret (örn: 32 byte -> 64 hex karakter)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Bu token'ı hashleyerek veritabanında saklamak daha güvenlidir (şifre gibi), ama şimdilik direkt saklayalım.
    const hashedTokenForDB = verificationToken; // VEYA crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpires = Date.now() + (parseInt(process.env.EMAIL_CHANGE_OTP_EXPIRES_IN_MINUTES || '10') * 60 * 1000); // Aynı süreyi kullanalım

    // Aşama 2 token/süresini kaydet, Aşama 1 bilgilerini temizle
    user.verifyNewEmailToken = hashedTokenForDB;
    user.verifyNewEmailExpires = verificationTokenExpires;
    user.changeEmailOtp = undefined;
    user.changeEmailOtpExpires = undefined;
    // user.newEmailAddress alanı kalsın, Aşama 3'te teyit için kullanılabilir
    await user.save();

    // E-posta Gönderme (YENİ E-postaya)
    try {
      const transporter = nodemailer.createTransport({   service: process.env.EMAIL_SERVICE, // örn: 'gmail'
        auth: {
          user: process.env.EMAIL_USERNAME, // örn: sizinepostanız@gmail.com
          pass: process.env.EMAIL_PASSWORD, // Google Uygulama Şifreniz
        },
        // Gmail için daha az güvenli uygulamalara izin vermek gerekebilir,
        // ancak Uygulama Şifresi kullanmak daha güvenlidir.
        // tls: { rejectUnauthorized: false } // Bazı durumlarda gerekebilir, dikkatli kullanın
         });
      // E-postada token'ı veya bir linki gönder
      // Yöntem A (Kod): Kullanıcının bu kodu girmesi istenir
       const emailHtml = `... (Yeni E-posta Doğrulama Kodunuz: ${verificationToken}) ...`;
      // Yöntem B (Link): Kullanıcının tıklaması istenir
      // const verificationUrl = `${process.env.FRONTEND_URL}/confirm-email/${verificationToken}`; // Frontend URL'si gerekir
      // const emailHtml = `... (Yeni e-postanızı doğrulamak için <a href="${verificationUrl}">buraya tıklayın</a>) ...`;

      const mailOptions = { from: process.env.EMAIL_FROM, to: newEmailLower, subject: 'Yeni E-posta Adresinizi Doğrulayın', html: emailHtml };
      await transporter.sendMail(mailOptions);
      console.log(`Aşama 2 Doğrulama Kodu/Linki gönderildi: ${newEmailLower}`);
      res.status(200).json({ msg: `Yeni e-posta adresinizi (${newEmailLower}) doğrulamak için bir kod/link gönderildi.` });

    } catch (mailError) {
      console.error('Aşama 2 doğrulama e-postası gönderme hatası:', mailError);
      // Hata durumunda Aşama 2 alanlarını temizle, Aşama 1'i geri yükleme (opsiyonel, karmaşık)
      user.verifyNewEmailToken = undefined; user.verifyNewEmailExpires = undefined; await user.save();
      return res.status(500).json({ msg: 'Yeni e-posta doğrulama e-postası gönderilirken bir hata oluştu.' });
    }

  } catch (err) {
    console.error('Verify Email Change Request Hatası:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

// Aşama 3: Yeni E-postadaki Kodu/Token'ı Onayla ve E-postayı GÜNCELLE
exports.confirmNewEmail = async (req, res) => {
  // Yöntem A (POST ile kod)
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { verificationCode } = req.body;
  const userId = req.user.id;

  try {
      // Kullanıcıyı ID, DOĞRU TOKEN ve SÜRE ile bul
      const user = await User.findOne({
          _id: userId,
          verifyNewEmailToken: verificationCode,
          verifyNewEmailExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ errors: [{ msg: 'Geçersiz veya süresi dolmuş doğrulama kodu.' }] });
      }

      // --- Başarılı Doğrulama ---

      // Yeni e-postanın BAŞKA BİRİ tarafından ANLIK olarak alınmadığından emin ol (Son Kontrol)
      const emailExists = await User.findOne({ email: user.newEmailAddress, _id: { $ne: user._id } });
      if (emailExists) {
          // Hata durumunda geçici alanları temizle
          user.verifyNewEmailToken = undefined; user.verifyNewEmailExpires = undefined; user.newEmailAddress = undefined;
          // Önceki aşamaların alanlarını da temizlemek isteyebilirsiniz
          user.changeEmailOtp = undefined; user.changeEmailOtpExpires = undefined;
          await user.save();
          return res.status(400).json({ errors: [{ msg: 'Bu e-posta adresi doğrulama sırasında başka bir hesap tarafından alınmış.' }] });
      }

      // E-POSTAYI GÜNCELLE!
      const oldEmail = user.email; // Eski e-postayı loglama/bildirim için saklayabiliriz
      const newlyConfirmedEmail = user.newEmailAddress; // Yeni e-postayı al
      user.email = newlyConfirmedEmail; // Asıl e-posta alanını güncelle

      // Tüm geçici alanları temizle
      user.changeEmailOtp = undefined;
      user.changeEmailOtpExpires = undefined;
      user.newEmailAddress = undefined;
      user.verifyNewEmailToken = undefined;
      user.verifyNewEmailExpires = undefined;

      // Kullanıcıyı GÜNCELLENMİŞ e-posta ve TEMİZLENMİŞ alanlarla kaydet
      await user.save();

      console.log(`E-posta başarıyla değiştirildi (Aşama 3): ${user.email} (ID: ${user.id})`);

      // --- YENİ: Başarılı Değişiklik Bildirim E-postası Gönder ---
      try {
          const transporter = nodemailer.createTransport({
              host: "smtp.gmail.com", // Veya service: 'gmail'
              port: 587,
              secure: false,
              auth: {
                  user: process.env.EMAIL_USERNAME,
                  pass: process.env.EMAIL_PASSWORD,
              },
              // logger: false, debug: false // Genellikle bildirim için detaylı loglamaya gerek yok
          });

          const notificationEmailHtml = `
          <!DOCTYPE html>
          <html lang="tr">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>E-posta Adresiniz Güncellendi</title>
              <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #ddd; }
                  .header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee;}
                  .header h1 { color: #333; margin: 0; font-size: 24px; }
                  .content p { margin-bottom: 15px; font-size: 16px; }
                  .email { font-weight: bold; color: #0056b3; }
                  .warning { background-color: #fff3cd; border-left: 5px solid #ffeeba; padding: 15px; margin-top: 20px; font-size: 14px; }
                  .footer { margin-top: 25px; text-align: center; font-size: 12px; color: #888; padding-top: 15px; border-top: 1px solid #eee;}
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>Hesap Bilgisi Güncellemesi</h1>
                  </div>
                  <div class="content">
                      <p>Merhaba ${user.name},</p>
                      <p>Bu e-posta, hesabınızla ilişkili e-posta adresinin başarıyla <strong class="email">${user.email}</strong> olarak güncellendiğini bildirmek içindir.</p>
                      <p>Artık hesabınıza giriş yaparken ve bildirimleri alırken bu yeni e-posta adresini kullanacaksınız.</p>
                      <div class="warning">
                          <strong>Önemli Güvenlik Uyarısı:</strong> Eğer bu e-posta adresi değişikliğini siz başlatmadıysanız, hesabınızın güvenliği tehlikede olabilir. Lütfen hemen <a href="${process.env.FRONTEND_URL || '#'}/password-reset-request">şifrenizi sıfırlayın</a> veya durumu bildirmek için bizimle iletişime geçin.
                      </div>
                  </div>
                  <div class="footer">
                      <p>© ${new Date().getFullYear()} Uygulama Adınız. Tüm hakları saklıdır.</p>
                      <p>Bu otomatik bir bildirimdir, lütfen yanıtlamayınız.</p>
                  </div>
              </div>
          </body>
          </html>`;

          // E-posta seçenekleri
          const mailOptions = {
              from: process.env.EMAIL_FROM,
              to: user.email, // Bildirimi YENİ e-postaya gönder
              subject: 'Hesap E-posta Adresiniz Başarıyla Güncellendi',
              html: notificationEmailHtml,
          };

          // E-postayı gönder
          await transporter.sendMail(mailOptions);
          console.log(`Başarılı e-posta değişikliği bildirimi gönderildi: ${user.email}`);

      } catch (notificationError) {
          // Bildirim e-postası gönderilemezse sadece logla, kullanıcıya hata verme.
          console.error(`!!! Bildirim e-postası gönderilemedi (${user.email}):`, notificationError);
          // Ana işlem başarılı olduğu için kullanıcıya yine de başarılı yanıtı gönderiyoruz.
      }
      // --- Bildirim E-postası Sonu ---


      // Başarılı yanıtı kullanıcıya gönder
      res.status(200).json({ msg: 'E-posta adresiniz başarıyla güncellendi ve doğrulandı.' });

  } catch (err) {
      console.error('Confirm New Email Hatası:', err.message);
      // Hata durumunda ve yanıt gönderilmediyse genel hata mesajı gönder
      if (!res.headersSent) {
          res.status(500).send('Sunucu Hatası');
      }
  }
};
