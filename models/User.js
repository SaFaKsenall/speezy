const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı zorunludur.'],
    unique: true,
    trim: true, 
    // maxlength: [50, 'Kullanıcı adı en fazla 50 karakter olabilir.']
  },
  email: {
    type: String,
    required: [true, 'E-posta alanı zorunludur.'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir e-posta adresi girin.',
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Şifre alanı zorunludur.'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır.'],
    select: false,
  },
  nativeLanguage: { // `native_language_id` -> `nativeLanguage` (camelCase)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language', // Hangi modele referans verdiğini belirtir (Language modelini oluştur)
    default: null, // NULL olabilir
  },
  profilePictureUrl: { // `profile_picture_url` -> `profilePictureUrl`
    type: String,
    default: null, // Varsayılan olarak boş veya null olabilir
    // match: [/^(http|https).../, 'Geçerli bir URL girin'] // İsteğe bağlı URL format kontrolü
  },
  totalXp: { // `total_xp` -> `totalXp`
    type: Number, // BIGINT için Number yeterlidir
    required: true,
    default: 0,
  },
  gems: { // `gems` -> `gems`
    type: Number,
    required: true,
    default: 0,
  },
  streakCount: { // `streak_count` -> `streakCount`
    type: Number,
    required: true,
    default: 0,
  },
  lastActiveDate: { // `last_active_date` -> `lastActiveDate`
    type: Date,
    default: null,
  },
  createdAt: { // `registration_date` -> `createdAt` 
    type: Date,
    default: Date.now,
  },
  isPremium: { // `is_premium` -> `isPremium`
    type: Boolean,
    required: true,
    default: false,
  },
  accountStatus: { // `account_status` -> `accountStatus`
    type: String,
    required: true,
    enum: { // ENUM karşılığı
        values: ['active', 'inactive', 'banned'],
        message: 'Hesap durumu sadece "active", "inactive", veya "banned" olabilir.'
    },
    default: 'active',
  },





  
  // --- YENİ ALANLAR ---
  resetPasswordOtp: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  // --- YENİ ALANLAR SONU ---

  // --- YENİ E-POSTA DEĞİŞİKLİĞİ ALANLARI ---
  changeEmailOtp: {
    type: String,
  },
  changeEmailOtpExpires: {
    type: Date,
  },
  newEmailAddress: { // Değiştirilmek istenen yeni e-posta adresi (doğrulama bekleniyor)
    type: String,
    match: [ // Yeni e-posta için de format kontrolü yapalım
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir e-posta adresi girin.',
    ],
    lowercase: true,
  },
  // --- YENİ E-POSTA DEĞİŞİKLİĞİ ALANLARI SONU ---



   // --- YENİ: E-posta Değişikliği Aşama 2 Alanları ---
   verifyNewEmailToken: { type: String },     // Yeni e-postaya giden doğrulama token/kodu
   verifyNewEmailExpires: { type: Date }      // Aşama 2 token/kod süresi


   
});

// Middleware (Hook): Kullanıcı kaydedilmeden veya şifre değişmeden önce çalışır
UserSchema.pre('save', async function (next) {
  // Sadece şifre alanı değiştirildiyse veya yeni oluşturulduysa hashle
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);