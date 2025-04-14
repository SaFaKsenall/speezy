const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword, getMe, initiateEmailChange, verifyEmailChangeRequest, confirmNewEmail,} = require('../controllers/authController'); // loginUser'ı import et
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Yeni kullanıcı kaydı
// @access  Public
router.post(
  '/register',
  [
    check('username', 'İsim alanı boş bırakılamaz.').not().isEmpty(),
    check('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail(),
    check('password', 'Şifre en az 6 karakter olmalıdır.').isLength({ min: 6 }),
  ],
  registerUser
);

// --- YENİ LOGIN ROTASI ---
// @route   POST /api/auth/login
// @desc    Kullanıcı girişi yap ve token al
// @access  Public
router.post(
  '/login',
  [
    // Gelen istek body'sindeki alanları doğrula
    check('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail(),
    check('password', 'Şifre alanı zorunludur.').exists(), // Şifrenin var olup olmadığını kontrol et
  ],
  loginUser // Doğrulamadan sonra loginUser kontrolcü fonksiyonunu çağır
);
// --- YENİ LOGIN ROTASI SONU ---


// --- YENİ ŞİFRE SIFIRLAMA ROTALARI ---

// @route   POST /api/auth/forgot-password
// @desc    Şifre sıfırlama talebi (OTP gönderir)
// @access  Public
router.post(
  '/forgot-password',
  [
    check('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail(),
  ],
  forgotPassword // forgotPassword kontrolcü fonksiyonu
);

// @route   POST /api/auth/reset-password
// @desc    Yeni şifreyi OTP ile ayarlar
// @access  Public
router.post(
  '/reset-password',
  [
    check('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail(),
    check('otp', 'OTP kodu gereklidir ve 6 haneli olmalıdır.').isLength({ min: 6, max: 6 }).isNumeric(),
    check('newPassword', 'Yeni şifre en az 6 karakter olmalıdır.').isLength({ min: 6 }),
  ],
  resetPassword // resetPassword kontrolcü fonksiyonu
);

// --- YENİ ŞİFRE SIFIRLAMA ROTALARI SONU ---






// --- YENİ KORUMALI ROTA ---
// @route   GET /api/auth/me
// @desc    Giriş yapmış kullanıcının bilgilerini al
// @access  Private (Token Gerekli)
router.get(
  '/me',
  protect, // Önce protect middleware'i çalışacak
  getMe      // Eğer protect 'next()' çağırırsa, getMe çalışacak
);
// --- YENİ KORUMALI ROTA SONU ---








// --- E-POSTA DEĞİŞİKLİĞİ ROTALARI (Korumalı) ---

// Aşama 1: Başlatma (Eski e-postaya OTP gönder)
router.post(
  '/initiate-email-change',
  protect,
  [ check('newEmail', 'Geçerli yeni e-posta girin.').isEmail() ],
  initiateEmailChange
);

// Aşama 2: Eski e-postadaki OTP'yi doğrula ve YENİ e-postaya doğrulama gönder
router.post(
  '/verify-email-change-request', // Yeni yol adı
  protect,
  [
    check('otp', 'OTP kodu (6 hane) gereklidir.').isLength({ min: 6, max: 6 }).isNumeric(),
    check('newEmail', 'Yeni e-posta adresi gereklidir.').isEmail(), // Teyit için hala gerekli
  ],
  verifyEmailChangeRequest // Yeni kontrolcü fonksiyonu
);

// Aşama 3: Yeni e-postadaki kodu/token'ı doğrula ve e-postayı GÜNCELLE
// Yöntem A: POST ile kod gönderme
router.post(
    '/confirm-new-email',
    protect, 
    [
        check('verificationCode', 'Doğrulama kodu gereklidir.').not().isEmpty(), // veya token
    ],
    confirmNewEmail // Yeni kontrolcü fonksiyonu
);




module.exports = router;







