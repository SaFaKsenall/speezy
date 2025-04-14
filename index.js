// ============================================================================
// INDEX.JS - Ana Sunucu Dosyası (Speezy API Backend)
// ============================================================================

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');


dotenv.config();


connectDB();

const app = express();


app.use(express.json());




const cors = require('cors');
 app.use(cors({
   origin: process.env.FRONTEND_URL || '*', 
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
   allowedHeaders: ['Content-Type', 'Authorization'], 
 }));


app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Speezy API Dokümantasyonu</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>">
        <style>
            /* --- Genel Stil ve Renk Paleti --- */
            :root {
                --primary-color: #3498db; --secondary-color: #7f8c8d; --success-color: #2ecc71;
                --warning-color: #f39c12; --danger-color: #e74c3c; --info-color: #0dcaf0; /* Daha belirgin info */
                --light-color: #f8f9fa; --dark-color: #2c3e50; --white-color: #ffffff;
                --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                --code-font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                --border-radius: 6px;
                --box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                --transition-speed: 0.2s;
            }
            /* --- Temel Sayfa Ayarları --- */
            html { scroll-behavior: smooth; } /* Sayfa içi linklerde yumuşak kaydırma */
            body { font-family: var(--font-family); line-height: 1.7; margin: 0; background-color: #f9fbfd; color: var(--dark-color); font-size: 16px; }
            /* --- Üst Bilgi (Navbar) --- */
            .navbar { background-color: var(--dark-color); color: var(--white-color); padding: 1rem 2rem; box-shadow: var(--box-shadow); position: sticky; top: 0; z-index: 1000; }
            .navbar h1 { margin: 0; font-size: 1.75rem; font-weight: 600; }
            .navbar a { color: var(--white-color); text-decoration: none; }
            /* --- Ana İçerik Alanı --- */
            .container { max-width: 1100px; /* Biraz daha geniş */ margin: 40px auto; padding: 0 25px; }
            /* --- API Genel Açıklama Kutusu --- */
            .api-description { background-color: #e7f3fe; padding: 30px; border-radius: var(--border-radius); margin-bottom: 40px; border: 1px solid #b8daff; color: #0a58ca; font-size: 1.05rem; }
            .api-description h2 { margin-top: 0; color: #074a9e; }
            .api-description code { background-color: #cfe2ff; padding: 4px 8px; border-radius: 4px; font-family: var(--code-font-family); font-size: 0.95em; }
            .api-description .base-url-container { display: flex; align-items: center; gap: 10px; margin-top: 15px; }
            .api-description .base-url-container code { flex-grow: 1; } /* Code alanının genişlemesi için */
            /* --- Endpoint Grupları --- */
            .endpoint-group { margin-bottom: 50px; }
            .endpoint-group h2 { color: var(--primary-color); border-bottom: 3px solid var(--primary-color); padding-bottom: 12px; margin-bottom: 30px; font-size: 2rem; font-weight: 600; }
            .endpoint-group h2 code { font-size: 1.5rem; color: var(--secondary-color); font-weight: 400; }
            /* --- Tek Endpoint Kartları --- */
            .endpoint { background: var(--white-color); margin-bottom: 30px; padding: 30px; border-radius: var(--border-radius); box-shadow: var(--box-shadow); border-left: 8px solid var(--info-color); transition: transform var(--transition-speed) ease-in-out, box-shadow var(--transition-speed) ease-in-out; }
            .endpoint:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
            .endpoint.post { border-left-color: var(--warning-color); }
            .endpoint.get { border-left-color: var(--success-color); }
            .endpoint.put { border-left-color: var(--primary-color); }
            .endpoint.delete { border-left-color: var(--danger-color); }
            /* --- Endpoint Başlığı (Metod, Yol) --- */
            .endpoint-header { display: flex; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 15px; position: relative; /* Kopyala butonu için */ }
            .method { font-weight: 700; display: inline-block; padding: 7px 14px; border-radius: var(--border-radius); color: var(--white-color); font-size: 1em; text-transform: uppercase; min-width: 80px; text-align: center; }
            .method.post { background-color: var(--warning-color); color: var(--dark-color); }
            .method.get { background-color: var(--success-color); }
            .method.put { background-color: var(--primary-color); }
            .method.delete { background-color: var(--danger-color); }
            .path { font-family: var(--code-font-family); font-size: 1.1em; /* Biraz küçültüldü */ font-weight: 600; word-break: break-all; color: var(--dark-color); flex-grow: 1; /* Kopyala butonu için yer açar */ }
            .path a { color: var(--primary-color); text-decoration: none; font-weight: 600; }
            .path a:hover { text-decoration: underline; color: #2980b9; }
            .path-container { display: flex; align-items: center; gap: 8px; flex-grow: 1; } /* Path ve kopyala butonu için */
            /* --- Endpoint Açıklaması --- */
            .description { color: var(--secondary-color); margin-bottom: 25px; font-size: 1.1rem; }
            .auth-required { display: inline-block; background-color: #fff3cd; color: #664d03; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; margin-left: 10px; border: 1px solid #ffecb5; font-weight: 600; }
            .auth-required .lock { margin-right: 4px; }
            /* --- Detay Bölümleri (İstek, Yanıt vb.) --- */
            .details h3 { color: var(--dark-color); font-size: 1.3rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid var(--light-color); padding-bottom: 8px; font-weight: 600; }
            /* --- Kod Blokları (Örnekler) --- */
            .code-block-wrapper { position: relative; margin-bottom: 15px; } /* Kopyala butonu için */
            pre { background-color: #2d3748; color: #e2e8f0; padding: 20px; border-radius: var(--border-radius); border: 1px solid #4a5568; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-family: var(--code-font-family); font-size: 0.95em; line-height: 1.6; margin-top: 10px; /* Üst boşluk */ }
            pre code { background: none; padding: 0; border: none; color: inherit; }
            /* Kopyala Butonu Stili */
            .copy-button {
                position: absolute;
                top: 10px;
                right: 10px;
                background-color: #4a5568;
                color: var(--light-color);
                border: none;
                padding: 6px 12px; /* Biraz büyütüldü */
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.85em; /* Biraz büyütüldü */
                opacity: 0; /* Normalde gizli */
                transition: opacity var(--transition-speed), background-color var(--transition-speed);
                font-family: var(--font-family); /* Normal font */
            }
            .code-block-wrapper:hover .copy-button,
            .path-container:hover .copy-button { opacity: 0.85; } /* Hover'da görünür */
            .copy-button:hover { opacity: 1; background-color: #5a6578; }
            .copy-button.copied { background-color: var(--success-color); color: var(--white-color); }
            /* URL Kopyalama Butonu için ek stil */
            .copy-button.url-copy { top: 50%; transform: translateY(-50%); right: 0; opacity: 0; /* URL için de başlangıçta gizli */ }
            .base-url-container .copy-button { position: static; /* Statik pozisyon */ transform: none; opacity: 0.85; /* Her zaman görünür */ }
            .base-url-container .copy-button:hover { opacity: 1; }
            /* --- Parametre Tabloları --- */
            .parameters-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
            .parameters-table th, .parameters-table td { border: 1px solid #e0e6ed; padding: 12px 15px; text-align: left; font-size: 0.95em; vertical-align: top; /* İçerik taşarsa hizalama */ }
            .parameters-table th { background-color: var(--light-color); font-weight: 600; color: var(--dark-color); }
            .parameters-table td code { font-family: var(--code-font-family); background-color: #e9ecef; padding: 3px 6px; border-radius: 4px; font-size: 0.9em; }
            .required-indicator { color: var(--danger-color); font-weight: 700; font-size: 0.9em; display: block; margin-top: 3px; }
            /* --- Yanıt Durum Kodları --- */
            .response-status { font-weight: 700; padding: 4px 10px; border-radius: var(--border-radius); display: inline-block; margin-right: 8px; font-size: 0.9em; color: var(--white-color) !important; }
            .status-200, .status-201 { background-color: var(--success-color); }
            .status-400 { background-color: var(--warning-color); color: var(--dark-color) !important; }
            .status-401, .status-403, .status-404 { background-color: var(--danger-color); }
            .status-500 { background-color: var(--dark-color); }
            .response-section p { margin-bottom: 10px; }
            .response-section .code-block-wrapper { margin-top: 5px; } /* Yanıt kodları arasında az boşluk */
            /* --- Test İpuçları Bölümü --- */
            .testing-tips { background-color: #fefce8; padding: 25px; border-radius: var(--border-radius); margin-bottom: 40px; border: 1px solid #fef08a; color: #713f12; }
            .testing-tips h3 { margin-top: 0; color: #854d0e; }
            .testing-tips ul { padding-left: 20px; margin-bottom: 0; }
            .testing-tips li { margin-bottom: 8px; }
            /* --- Alt Bilgi (Footer) --- */
            footer { text-align: center; margin-top: 60px; padding: 30px; color: var(--secondary-color); font-size: 0.9em; border-top: 1px solid #e0e6ed; background-color: var(--white-color); }
        </style>
    </head>
    <body>

        <header class="navbar">
           <a href="/"><h1>Speezy API Dokümantasyonu</h1></a>
        </header>

        <main class="container">

            <section class="api-description">
                <h2>API Genel Bakış</h2>
                <p>Speezy uygulaması için geliştirilen backend API'sine hoş geldiniz. Bu doküman, mevcut API endpoint'lerini, gerekli parametreleri, beklenen yanıtları ve test yöntemlerini detaylandırmaktadır.</p>
                <p><strong>Temel URL (Base URL):</strong></p>
                <div class="base-url-container">
                  <code id="baseUrlCode">${baseUrl}</code>
                  <button class="copy-button" data-copy-target="#baseUrlCode" title="Base URL'i Kopyala">Kopyala</button>
                </div>
                <p>Tüm istekler ve yanıtlar <strong>JSON</strong> formatında olmalıdır. İsteklerde <code>Content-Type: application/json</code> başlığını göndermeyi unutmayın.</p>
                <p><strong>Kimlik Doğrulama:</strong> <span class="auth-required"><span class="lock">🔒</span> Yetkilendirme Gerektirir</span> ile işaretli endpoint'ler, geçerli bir JWT'nin <code>Authorization: Bearer <token></code> başlığı ile gönderilmesini gerektirir. Token, <code>/api/auth/login</code> endpoint'inden alınır.</p>
            </section>

             <section class="testing-tips">
                <h3>API Nasıl Test Edilir?</h3>
                <p>Bu API endpoint'lerini test etmek için aşağıdaki araçları veya yöntemleri kullanabilirsiniz:</p>
                <ul>
                    <li><strong>Postman:</strong> Popüler bir API test aracıdır. İstekleri kolayca oluşturmanızı, göndermenizi ve yanıtları incelemenizi sağlar. <a href="https://www.postman.com/downloads/" target="_blank" rel="noopener noreferrer">İndirin</a></li>
                    <li><strong>Insomnia:</strong> Postman'e benzer, açık kaynaklı bir alternatiftir. <a href="https://insomnia.rest/download" target="_blank" rel="noopener noreferrer">İndirin</a></li>
                    <li><strong>curl:</strong> Komut satırı aracıdır. Basit istekler için hızlı bir yoldur. Örnek: <br><code>curl -X POST -H "Content-Type: application/json" -d '{"email":"speezyteam@gmail.com", "password":"speezyteam"}' ${baseUrl}/api/auth/login</code></li>
                    <li><strong>Frontend Uygulamanız:</strong> API'yi entegre ettiğiniz kendi web veya mobil uygulamanız üzerinden test edebilirsiniz. Tarayıcının geliştirici araçları (Network sekmesi) istekleri ve yanıtları izlemek için kullanışlıdır.</li>
                </ul>
                <p><strong>Unutmayın:</strong> <code>POST</code>, <code>PUT</code> gibi metodlarla veri gönderirken <code>Content-Type: application/json</code> başlığını ve istek gövdesini (body) doğru formatta eklediğinizden emin olun. Korunmuş endpoint'ler için <code>Authorization: Bearer <token></code> başlığını eklemeyi unutmayın.</p>
            </section>

            <!-- ======================= Kimlik Doğrulama Endpoint Grubu ======================= -->
            <section id="auth-group" class="endpoint-group">
                <h2>Kimlik Doğrulama <code>/api/auth</code></h2>
                <p>Kullanıcı hesap işlemleri: Kayıt, giriş, şifre sıfırlama, e-posta değişikliği ve profil bilgisi alma.</p>

                <!-- Endpoint: POST /api/auth/register -->
                <article id="register" class="endpoint post">
                    <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                           <span class="path"><a href="#register">/api/auth/register</a></span>
                           <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/register" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                    </div>
                    <p class="description">Yeni bir kullanıcı hesabı oluşturur.</p>
                    <div class="details">
                        <h3>İstek Gövdesi (Request Body)</h3>
                        <table class="parameters-table">
                           <thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead>
                           <tbody>
                               <tr><td><code>name</code></td><td>String</td><td>Kullanıcının tam adı.</td><td><span class="required-indicator">Evet</span></td></tr>
                               <tr><td><code>email</code></td><td>String</td><td>Geçerli ve sistemde kayıtlı olmayan e-posta.</td><td><span class="required-indicator">Evet</span></td></tr>
                               <tr><td><code>password</code></td><td>String</td><td>Şifre (min. 6 karakter).</td><td><span class="required-indicator">Evet</span></td></tr>
                           </tbody>
                        </table>
                        <p><strong>Örnek İstek:</strong></p>
                        <div class="code-block-wrapper">
                            <pre><code class="language-json" id="register-req-example">{
  "username": "speezy",
  "email": "speezyteam@gmail.com",
  "password": "speezyteam"
}</code></pre>
                            <button class="copy-button" data-copy-target="#register-req-example" title="Örnek İsteği Kopyala">Kopyala</button>
                        </div>
                        <h3>Yanıtlar (Responses)</h3>
                        <div class="response-section">
                            <p><span class="response-status status-201">201 Created</span> Kullanıcı başarıyla oluşturuldu.</p>
                             <div class="code-block-wrapper">
                                <pre><code class="language-json" id="register-res-201">{
  "msg": "Kullanıcı başarıyla kaydedildi.",
  "userId": "65cb..."
}</code></pre>
                                <button class="copy-button" data-copy-target="#register-res-201" title="Başarılı Yanıtı Kopyala">Kopyala</button>
                            </div>
                            <p><span class="response-status status-400">400 Bad Request</span> Eksik/geçersiz alanlar veya e-posta zaten kullanımda.</p>
                            <div class="code-block-wrapper">
                                <pre><code class="language-json" id="register-res-400">{
  "errors": [
    { "msg": "Lütfen geçerli bir e-posta adresi girin." },
    { "msg": "Şifre en az 6 karakter olmalıdır." }
    /* veya */
    { "msg": "Bu e-posta adresi zaten kullanımda." }
 ]
}</code></pre>
                                <button class="copy-button" data-copy-target="#register-res-400" title="Hata Yanıtını Kopyala">Kopyala</button>
                            </div>
                            <p><span class="response-status status-500">500 Internal Server Error</span> Sunucu tarafında beklenmedik bir hata oluştu.</p>
                        </div>
                    </div>
                </article>

                <!-- Endpoint: POST /api/auth/login -->
                <article id="login" class="endpoint post">
                     <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                           <span class="path"><a href="#login">/api/auth/login</a></span>
                           <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/login" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                    </div>
                     <p class="description">Kayıtlı kullanıcı girişi yapar ve erişim token'ı (JWT) döndürür.</p>
                     <div class="details">
                        <h3>İstek Gövdesi</h3>
                        <table class="parameters-table"> <thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead><tbody><tr><td><code>email</code></td><td>String</td><td>Kayıtlı e-posta adresi.</td><td><span class="required-indicator">Evet</span></td></tr><tr><td><code>password</code></td><td>String</td><td>Kullanıcı şifresi.</td><td><span class="required-indicator">Evet</span></td></tr></tbody> </table>
                        <p><strong>Örnek İstek:</strong></p>
                        <div class="code-block-wrapper"><pre><code class="language-json" id="login-req-example">{
  "email": "speezyteam@gmail.com",
  "password": "speezyteam"
}</code></pre><button class="copy-button" data-copy-target="#login-req-example" title="Örnek İsteği Kopyala">Kopyala</button></div>
                        <h3>Yanıtlar</h3>
                         <div class="response-section">
                            <p><span class="response-status status-200">200 OK</span> Giriş başarılı. Dönen token sonraki isteklerde kullanılmalı.</p>
                            <div class="code-block-wrapper"><pre><code class="language-json" id="login-res-200">{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjVjYj..." /* Çok uzun JWT token */
}</code></pre><button class="copy-button" data-copy-target="#login-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                            <p><span class="response-status status-400">400 Bad Request</span> Geçersiz kimlik bilgileri (e-posta veya şifre hatalı).</p>
                            <div class="code-block-wrapper"><pre><code class="language-json" id="login-res-400">{ "errors": [ { "msg": "Geçersiz kimlik bilgileri." } ] }</code></pre><button class="copy-button" data-copy-target="#login-res-400" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                            <p><span class="response-status status-500">500 Internal Server Error</span> Sunucu hatası.</p>
                        </div>
                     </div>
                </article>

                 <!-- Endpoint: GET /api/auth/me -->
                <article id="getMe" class="endpoint get">
                    <div class="endpoint-header">
                        <span class="method get">GET</span>
                        <div class="path-container">
                           <span class="path"><a href="#getMe">/api/auth/me</a></span>
                           <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/me" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                        <span class="auth-required"><span class="lock">🔒</span> Yetkilendirme Gerektirir</span>
                    </div>
                    <p class="description">Oturum açmış kullanıcının profil bilgilerini (şifre hariç) getirir.</p>
                     <div class="details">
                         <h3>Kimlik Doğrulama</h3>
                         <p>Bu endpoint'e erişim için geçerli bir JWT token'ının <code>Authorization</code> başlığında gönderilmesi zorunludur:</p>
                         <div class="code-block-wrapper"><pre><code id="auth-header-example">Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...</code></pre><button class="copy-button" data-copy-target="#auth-header-example" title="Örnek Başlığı Kopyala">Kopyala</button></div>
                         <h3>Yanıtlar</h3>
                         <div class="response-section">
                            <p><span class="response-status status-200">200 OK</span> Kullanıcı bilgileri başarıyla alındı.</p>
                            <div class="code-block-wrapper"><pre><code class="language-json" id="getme-res-200">{
  "_id": "65cb...",
  "name": "speezy",
  "email": "speezyteam@gmail.com",
  "createdAt": "2024-02-12T10:30:00.000Z",
  "updatedAt": "2024-02-12T10:30:00.000Z"
  /* Şifre gibi hassas veriler burada yer almaz */
}</code></pre><button class="copy-button" data-copy-target="#getme-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                            <p><span class="response-status status-401">401 Unauthorized</span> Yetkisiz erişim (Token yok, geçersiz veya süresi dolmuş).</p>
                            <div class="code-block-wrapper"><pre><code class="language-json" id="getme-res-401">{ "msg": "Token bulunamadı, yetkilendirme reddedildi." /* veya "Geçersiz token." */ }</code></pre><button class="copy-button" data-copy-target="#getme-res-401" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-404">404 Not Found</span> Belirtilen token'a ait kullanıcı bulunamadı.</p>
                            <p><span class="response-status status-500">500 Internal Server Error</span> Sunucu hatası.</p>
                        </div>
                    </div>
                </article>

                <!-- Endpoint: POST /api/auth/forgot-password -->
                 <article id="forgotPassword" class="endpoint post">
                    <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                           <span class="path"><a href="#forgotPassword">/api/auth/forgot-password</a></span>
                           <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/forgot-password" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                    </div>
                    <p class="description">Kullanıcının e-postasına şifre sıfırlama için tek kullanımlık kod (OTP) gönderir.</p>
                     <div class="details">
                         <h3>İstek Gövdesi</h3>
                         <table class="parameters-table"> <thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead><tbody><tr><td><code>email</code></td><td>String</td><td>Hesabın kayıtlı e-posta adresi.</td><td><span class="required-indicator">Evet</span></td></tr></tbody> </table>
                         <p><strong>Örnek İstek:</strong></p>
                         <div class="code-block-wrapper"><pre><code class="language-json" id="forgotpw-req-example">{ "email": "speezyteam@gmail.com" }</code></pre><button class="copy-button" data-copy-target="#forgotpw-req-example" title="Örnek İsteği Kopyala">Kopyala</button></div>
                         <h3>Yanıtlar</h3>
                         <div class="response-section">
                             <p><span class="response-status status-200">200 OK</span> İstek işlendi. Güvenlik nedeniyle, e-posta kayıtlı olmasa bile aynı mesaj dönebilir.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="forgotpw-res-200">{
  "msg": "Eğer e-posta adresiniz sistemimizde kayıtlıysa, şifre sıfırlama talimatları içeren bir e-posta gönderilecektir."
}</code></pre><button class="copy-button" data-copy-target="#forgotpw-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-400">400 Bad Request</span> Geçersiz e-posta formatı.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="forgotpw-res-400">{ "errors": [ { "msg": "Lütfen geçerli bir e-posta adresi girin." } ] }</code></pre><button class="copy-button" data-copy-target="#forgotpw-res-400" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-500">500 Internal Server Error</span> E-posta gönderimi sırasında hata veya sunucu hatası.</p>
                         </div>
                     </div>
                </article>

                <!-- Endpoint: POST /api/auth/reset-password -->
                <article id="resetPassword" class="endpoint post">
                    <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                           <span class="path"><a href="#resetPassword">/api/auth/reset-password</a></span>
                           <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/reset-password" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                    </div>
                    <p class="description">E-posta ile alınan OTP kodu ve yeni şifre ile kullanıcı şifresini günceller.</p>
                     <div class="details">
                         <h3>İstek Gövdesi</h3>
                         <table class="parameters-table"> <thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead><tbody><tr><td><code>email</code></td><td>String</td><td>Hesabın kayıtlı e-posta adresi.</td><td><span class="required-indicator">Evet</span></td></tr><tr><td><code>otp</code></td><td>String</td><td>E-posta ile alınan 6 haneli OTP kodu.</td><td><span class="required-indicator">Evet</span></td></tr><tr><td><code>newPassword</code></td><td>String</td><td>Yeni şifre (min. 6 karakter).</td><td><span class="required-indicator">Evet</span></td></tr></tbody> </table>
                         <p><strong>Örnek İstek:</strong></p>
                         <div class="code-block-wrapper"><pre><code class="language-json" id="resetpw-req-example">{
  "email": "speezyteam@gmail.com",
  "otp": "123456",
  "newPassword": "YeniGucluSifre!123"
}</code></pre><button class="copy-button" data-copy-target="#resetpw-req-example" title="Örnek İsteği Kopyala">Kopyala</button></div>
                         <h3>Yanıtlar</h3>
                         <div class="response-section">
                             <p><span class="response-status status-200">200 OK</span> Şifre başarıyla güncellendi.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="resetpw-res-200">{ "msg": "Şifreniz başarıyla güncellendi." }</code></pre><button class="copy-button" data-copy-target="#resetpw-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-400">400 Bad Request</span> OTP geçersiz, süresi dolmuş, e-posta bulunamadı veya yeni şifre kurallara uymuyor.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="resetpw-res-400">{
  "errors": [ { "msg": "Geçersiz veya süresi dolmuş OTP kodu." } ]
  /* veya */
  "errors": [ { "msg": "Yeni şifre en az 6 karakter olmalıdır." } ]
  /* veya */
  "errors": [ { "msg": "Belirtilen e-posta ile eşleşen aktif bir sıfırlama isteği bulunamadı." } ]
}</code></pre><button class="copy-button" data-copy-target="#resetpw-res-400" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-500">500 Internal Server Error</span> Sunucu hatası.</p>
                         </div>
                     </div>
                </article>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
                <h4>E-posta Değişikliği (Çok Aşamalı Süreç)</h4>
                <p>Güvenlik nedeniyle e-posta değişikliği 3 aşamada gerçekleşir: Başlatma, Mevcut E-postayı Doğrulama, Yeni E-postayı Doğrulama.</p>

                 <!-- Endpoint: POST /api/auth/initiate-email-change (Aşama 1) -->
                <article id="initiateEmailChange" class="endpoint post">
                    <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                           <span class="path"><a href="#initiateEmailChange">/api/auth/initiate-email-change</a></span>
                           <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/initiate-email-change" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                        <span class="auth-required"><span class="lock">🔒</span> Yetkilendirme Gerektirir</span>
                    </div>
                    <p class="description"><strong>Aşama 1:</strong> Yeni e-posta adresi değişikliği talebini başlatır. Onay kodu **mevcut** e-posta adresine gönderilir.</p>
                    <div class="details">
                        <h3>Kimlik Doğrulama</h3> <p><code>Authorization: Bearer <token></code> başlığı gereklidir.</p>
                        <h3>İstek Gövdesi</h3> <table class="parameters-table"><thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead><tbody><tr><td><code>newEmail</code></td><td>String</td><td>Geçilmek istenen yeni, geçerli ve sistemde kayıtlı olmayan e-posta adresi.</td><td><span class="required-indicator">Evet</span></td></tr></tbody></table>
                        <p><strong>Örnek İstek:</strong></p>
                        <div class="code-block-wrapper"><pre><code class="language-json" id="init-email-req">{ "newEmail": "speezyteamyenieposta@gmail.com" }</code></pre><button class="copy-button" data-copy-target="#init-email-req" title="Örnek İsteği Kopyala">Kopyala</button></div>
                        <h3>Yanıtlar</h3>
                         <div class="response-section">
                            <p><span class="response-status status-200">200 OK</span> Talep alındı, doğrulama kodu mevcut e-postaya gönderildi.</p>
                            <div class="code-block-wrapper"><pre><code class="language-json" id="init-email-res-200">{
 "msg": "E-posta değişikliği talebinizi onaylamak için mevcut e-posta adresinize (a***@email.com) bir doğrulama kodu gönderildi."
}</code></pre><button class="copy-button" data-copy-target="#init-email-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                            <p><span class="response-status status-400">400 Bad Request</span> Yeni e-posta geçersiz, mevcut e-posta ile aynı veya zaten başka bir kullanıcı tarafından kullanılıyor.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="init-email-res-400">{
  "errors": [ { "msg": "Yeni e-posta adresi zaten kullanımda." } ]
  /* veya */
  "errors": [ { "msg": "Yeni e-posta adresi mevcut adresinizle aynı olamaz." } ]
}</code></pre><button class="copy-button" data-copy-target="#init-email-res-400" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                            <p><span class="response-status status-401">401 Unauthorized</span> Yetkisiz.</p>
                            <p><span class="response-status status-500">500 Internal Server Error</span> E-posta gönderilemedi veya sunucu hatası.</p>
                         </div>
                    </div>
                </article>

                <!-- Endpoint: POST /api/auth/verify-email-change-request (Aşama 2) -->
                <article id="verifyEmailChangeRequest" class="endpoint post">
                     <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                            <span class="path"><a href="#verifyEmailChangeRequest">/api/auth/verify-email-change-request</a></span>
                            <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/verify-email-change-request" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                         <span class="auth-required"><span class="lock">🔒</span> Yetkilendirme Gerektirir</span>
                     </div>
                     <p class="description"><strong>Aşama 2:</strong> **Mevcut** e-postaya gelen OTP kodunu doğrular. Başarılı olursa, **yeni** e-posta adresine son onay kodunu/linkini gönderir.</p>
                     <div class="details">
                        <h3>Kimlik Doğrulama</h3> <p><code>Authorization: Bearer <token></code> başlığı gereklidir.</p>
                        <h3>İstek Gövdesi</h3> <table class="parameters-table"><thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead><tbody><tr><td><code>otp</code></td><td>String</td><td>Mevcut e-postaya gelen 6 haneli kod.</td><td><span class="required-indicator">Evet</span></td></tr><tr><td><code>newEmail</code></td><td>String</td><td>Değiştirilmesi istenen yeni e-posta adresi (Aşama 1'deki ile aynı olmalı).</td><td><span class="required-indicator">Evet</span></td></tr></tbody></table>
                        <p><strong>Örnek İstek:</strong></p>
                         <div class="code-block-wrapper"><pre><code class="language-json" id="verify-email-req">{
  "otp": "654321",
  "newEmail": "speezyteamyenieposta@gmail.com"
}</code></pre><button class="copy-button" data-copy-target="#verify-email-req" title="Örnek İsteği Kopyala">Kopyala</button></div>
                        <h3>Yanıtlar</h3>
                        <div class="response-section">
                             <p><span class="response-status status-200">200 OK</span> Mevcut e-posta doğrulandı, yeni e-postaya onay maili gönderildi.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="verify-email-res-200">{
  "msg": "Mevcut e-posta adresiniz doğrulandı. Yeni e-posta adresinizi (sp***eposta@gmail.com) onaylamak için bir doğrulama kodu/linki gönderildi."
}</code></pre><button class="copy-button" data-copy-target="#verify-email-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-400">400 Bad Request</span> OTP/E-posta geçersiz, süre dolmuş veya Aşama 1'deki taleple eşleşmiyor.</p>
                              <div class="code-block-wrapper"><pre><code class="language-json" id="verify-email-res-400">{
  "errors": [ { "msg": "Geçersiz veya süresi dolmuş doğrulama kodu." } ]
  /* veya */
  "errors": [ { "msg": "Bekleyen e-posta değişikliği talebiyle eşleşmiyor." } ]
}</code></pre><button class="copy-button" data-copy-target="#verify-email-res-400" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-401">401 Unauthorized</span> Yetkisiz.</p>
                             <p><span class="response-status status-500">500 Internal Server Error</span> Sunucu hatası veya e-posta gönderilemedi.</p>
                        </div>
                     </div>
                </article>

                <!-- Endpoint: POST /api/auth/confirm-new-email (Aşama 3) -->
                <article id="confirmNewEmail" class="endpoint post">
                     <div class="endpoint-header">
                        <span class="method post">POST</span>
                        <div class="path-container">
                            <span class="path"><a href="#confirmNewEmail">/api/auth/confirm-new-email</a></span>
                            <button class="copy-button url-copy" data-copy-text="${baseUrl}/api/auth/confirm-new-email" title="Endpoint URL'ini Kopyala">Kopyala</button>
                        </div>
                         <span class="auth-required"><span class="lock">🔒</span> Yetkilendirme Gerektirir</span>
                     </div>
                     <p class="description"><strong>Aşama 3:</strong> **Yeni** e-postaya gelen doğrulama kodu/token'ı ile e-posta değişikliğini tamamlar ve kullanıcının e-postasını günceller.</p>
                     <div class="details">
                        <h3>Kimlik Doğrulama</h3> <p><code>Authorization: Bearer <token></code> başlığı gereklidir.</p>
                        <h3>İstek Gövdesi</h3> <table class="parameters-table"><thead><tr><th>Alan</th><th>Tip</th><th>Açıklama</th><th>Gerekli</th></tr></thead><tbody><tr><td><code>verificationCode</code></td><td>String</td><td>Yeni e-posta adresine gönderilen doğrulama kodu veya token'ı.</td><td><span class="required-indicator">Evet</span></td></tr></tbody></table>
                         <p><strong>Örnek İstek:</strong></p>
                         <div class="code-block-wrapper"><pre><code class="language-json" id="confirm-email-req">{
  "verificationCode": "abcdef123456..." /* E-postaya gelen kod/token */
}</code></pre><button class="copy-button" data-copy-target="#confirm-email-req" title="Örnek İsteği Kopyala">Kopyala</button></div>
                        <h3>Yanıtlar</h3>
                        <div class="response-section">
                             <p><span class="response-status status-200">200 OK</span> E-posta adresi başarıyla güncellendi ve doğrulandı.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="confirm-email-res-200">{ "msg": "E-posta adresiniz başarıyla güncellendi ve doğrulandı." }</code></pre><button class="copy-button" data-copy-target="#confirm-email-res-200" title="Başarılı Yanıtı Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-400">400 Bad Request</span> Doğrulama kodu geçersiz, süresi dolmuş veya aktif bir değişiklik talebi bulunamadı.</p>
                             <div class="code-block-wrapper"><pre><code class="language-json" id="confirm-email-res-400">{
 "errors": [ { "msg": "Geçersiz veya süresi dolmuş doğrulama kodu/token'ı." } ]
}</code></pre><button class="copy-button" data-copy-target="#confirm-email-res-400" title="Hata Yanıtını Kopyala">Kopyala</button></div>
                             <p><span class="response-status status-401">401 Unauthorized</span> Yetkisiz.</p>
                             <p><span class="response-status status-500">500 Internal Server Error</span> Sunucu hatası.</p>
                         </div>
                     </div>
                </article>


            </section> <!-- Endpoint Grubu Sonu -->

            <!--
            <section id="users-group" class="endpoint-group">
                <h2>Kullanıcı İşlemleri <code>/api/users</code></h2>
                <p>Kullanıcı profili yönetimi ve diğer kullanıcılarla ilgili işlemler.</p>
                (/api/users endpoint'leri için article'lar eklenecek)
            </section>
            -->

        </main>

        <footer>
            <p>© ${new Date().getFullYear()} Speezy API. Tüm hakları saklıdır.</p>
        </footer>

        <script>
          // Sayfa yüklendiğinde kopyalama işlevselliğini etkinleştir
          document.addEventListener('DOMContentLoaded', () => {
            const copyButtons = document.querySelectorAll('.copy-button');

            copyButtons.forEach(button => {
              button.addEventListener('click', () => {
                let textToCopy = '';
                const targetSelector = button.getAttribute('data-copy-target');
                const directText = button.getAttribute('data-copy-text');

                if (targetSelector) {
                  const targetElement = document.querySelector(targetSelector);
                  if (targetElement) {
                    // <pre><code> yapısı için özel kontrol
                    if (targetElement.tagName === 'CODE' && targetElement.parentNode.tagName === 'PRE') {
                      textToCopy = targetElement.innerText || targetElement.textContent;
                    } else {
                      textToCopy = targetElement.innerText || targetElement.textContent;
                    }
                  }
                } else if (directText) {
                  textToCopy = directText;
                }

                if (textToCopy) {
                  navigator.clipboard.writeText(textToCopy.trim())
                    .then(() => {
                      // Başarı geri bildirimi
                      const originalText = button.textContent;
                      button.textContent = 'Kopyalandı!';
                      button.classList.add('copied');
                      button.disabled = true; // Kopyalandıktan sonra kısa süreliğine devre dışı bırak

                      setTimeout(() => {
                        button.textContent = originalText;
                        button.classList.remove('copied');
                        button.disabled = false; // Tekrar etkinleştir
                      }, 1500); // 1.5 saniye sonra eski haline dön
                    })
                    .catch(err => {
                      console.error('Kopyalama başarısız oldu:', err);
                      // Hata geri bildirimi (opsiyonel)
                      // button.textContent = 'Hata!';
                      // setTimeout(() => { button.textContent = 'Kopyala'; }, 2000);
                    });
                } else {
                    console.warn('Kopyalanacak metin bulunamadı:', button);
                }
              });
            });
          });
        </script>

    </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html'); // Content-Type başlığını ayarla
  res.send(htmlContent);
});

app.use('/api/auth', authRoutes);






// ----- 9. Sunucu Portunun Belirlenmesi ve Sunucunun Başlatılması -----
const PORT = process.env.PORT || 3000; // .env dosyasından PORT alınır, yoksa 5000 kullanılır.

app.listen(PORT, () => console.log(
  `\n🚀 Sunucu ${process.env.NODE_ENV || 'development'} modunda http://localhost:${PORT} adresinde başarıyla başlatıldı.` +
  `\n📄 API Dokümantasyonu: http://localhost:${PORT}`
));

