import { useState } from 'react'
import { Menu, X, Calendar, Users, BookOpen, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            {/* Sol Menü */}
            <div className="nav-left">
              <Link to="/" className="logo">Okuloji</Link>
              <div className="nav-links desktop-only">
                <a href="#ozellikler">Özellikler</a>
                <a href="#fiyatlandirma">Ürün Fiyatlandırması</a>
                <a href="#dokumantasyon">Dökümantasyon</a>
              </div>
            </div>

            {/* Sağ Menü */}
            <div className="nav-right desktop-only">
              <Link to="/login" className="nav-link">Giriş Yap</Link>
              <Link to="/login" className="btn btn-primary">Kaydol</Link>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="mobile-menu">
              <a href="#ozellikler">Özellikler</a>
              <a href="#fiyatlandirma">Ürün Fiyatlandırması</a>
              <a href="#dokumantasyon">Dökümantasyon</a>
              <Link to="/login">Giriş Yap</Link>
              <Link to="/login" className="btn btn-primary">Kaydol</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Ders Programlarınızı Dakikalar İçinde
            <br />
            <span className="highlight">İstediğiniz Yerden Oluşturun</span>
          </h1>
          <p className="hero-subtitle">
            Her büyüklükteki okullar için modern, hızlı ve kullanıcı dostu ders programı yönetim sistemi
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary btn-large">
              Ücretsiz Deneyin <ArrowRight size={20} style={{marginLeft: '8px'}} />
            </Link>
            <a href="#ozellikler" className="btn btn-secondary btn-large">
              Özellikleri İncele
            </a>
          </div>

          {/* Stats */}
          <div className="stats">
            <div className="stat-item">
              <div className="stat-number">6+</div>
              <div className="stat-label">Yıllık Deneyim</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3000+</div>
              <div className="stat-label">Aktif Kullanıcı</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">36K+</div>
              <div className="stat-label">Oluşturulan Program</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="features">
        <div className="container">
          <h2 className="section-title">Okulunuzun İhtiyacı Olan Her Şey</h2>
          <p className="section-subtitle">
            Sezgisel arayüzümüz, hızlı veri girişi sağlar ve programları ihtiyaçlarınıza göre özelleştirme esnekliği sunar
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <Calendar size={48} className="feature-icon" />
              <h3>Hızlı Oluşturma</h3>
              <p>Ders programlarını günler değil, dakikalar içinde oluşturun. Manuel süreçlere veda edin.</p>
            </div>

            <div className="feature-card">
              <Users size={48} className="feature-icon" />
              <h3>Kolay Yönetim</h3>
              <p>Öğretmen, sınıf ve derslik bilgilerini kolayca yönetin. Excel'den toplu veri aktarımı yapın.</p>
            </div>

            <div className="feature-card">
              <BookOpen size={48} className="feature-icon" />
              <h3>Esnek Düzenleme</h3>
              <p>Oluşturulan programları sürükle-bırak ile kolayca düzenleyin. Çakışmaları otomatik tespit edin.</p>
            </div>

            <div className="feature-card">
              <Clock size={48} className="feature-icon" />
              <h3>Zaman Tasarrufu</h3>
              <p>Ders programı oluşturma sürenizi %90 azaltın. Daha önemli işlere odaklanın.</p>
            </div>

            <div className="feature-card">
              <CheckCircle size={48} className="feature-icon" />
              <h3>Çakışma Kontrolü</h3>
              <p>Sistem otomatik olarak çakışmaları tespit eder ve sizi uyarır. Hatasız programlar oluşturun.</p>
            </div>

            <div className="feature-card">
              <ArrowRight size={48} className="feature-icon" />
              <h3>Export/Import</h3>
              <p>PDF ve Excel formatında dışa aktarın. Yazdırılabilir ve paylaşılabilir programlar oluşturun.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">3 Kolay Adımda Ders Programı</h2>

          <div className="steps">
            {/* Step 1 */}
            <div className="step">
              <div className="step-content">
                <div className="step-number">1</div>
                <h3>Veriler ve Kısıtlamalar</h3>
                <p>
                  Okul verilerini girin. Verileri sezgisel arayüz ile kolayca girebilir veya bir Excel dosyası aracılığıyla okul bilgilerini içe aktarabilirsiniz.
                </p>
                <ul className="step-list">
                  <li><CheckCircle size={20} /> Öğretmen bilgileri</li>
                  <li><CheckCircle size={20} /> Sınıf ve derslik bilgileri</li>
                  <li><CheckCircle size={20} /> Ders dağılımları</li>
                </ul>
              </div>
              <div className="step-visual">
                <BookOpen size={96} />
              </div>
            </div>

            {/* Step 2 */}
            <div className="step step-reverse">
              <div className="step-content">
                <div className="step-number">2</div>
                <h3>Manuel Düzenleme</h3>
                <p>
                  Sürükle-bırak ile dersleri istediğiniz yere yerleştirin. Sistem otomatik olarak çakışmaları kontrol eder ve sizi uyarır.
                </p>
                <ul className="step-list">
                  <li><CheckCircle size={20} /> Sürükle-bırak arayüz</li>
                  <li><CheckCircle size={20} /> Otomatik çakışma tespiti</li>
                  <li><CheckCircle size={20} /> Gerçek zamanlı önizleme</li>
                </ul>
              </div>
              <div className="step-visual">
                <Calendar size={96} />
              </div>
            </div>

            {/* Step 3 */}
            <div className="step">
              <div className="step-content">
                <div className="step-number">3</div>
                <h3>Gözden Geçirin ve Dışa Aktarın</h3>
                <p>
                  Ders programı oluşturulduktan sonra PDF veya Excel olarak dışa aktarın. Yazdırın, paylaşın veya web'de yayınlayın.
                </p>
                <ul className="step-list">
                  <li><CheckCircle size={20} /> PDF export</li>
                  <li><CheckCircle size={20} /> Excel export</li>
                  <li><CheckCircle size={20} /> Öğretmen/Sınıf bazlı görünümler</li>
                </ul>
              </div>
              <div className="step-visual">
                <ArrowRight size={96} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="fiyatlandirma" className="pricing">
        <div className="container">
          <h2 className="section-title">Ürün Fiyatlandırması</h2>
          <p className="section-subtitle">Tamamen ücretsiz! Tüm özellikler açık.</p>

          <div className="pricing-card">
            <h3>Ücretsiz Plan</h3>
            <div className="price">₺0</div>
            <p className="price-desc">Sınırsız kullanım, tüm özellikler</p>
            
            <ul className="pricing-features">
              <li><CheckCircle size={24} /> Sınırsız öğretmen ve sınıf</li>
              <li><CheckCircle size={24} /> Manuel ders programı oluşturma</li>
              <li><CheckCircle size={24} /> Çakışma kontrolü</li>
              <li><CheckCircle size={24} /> PDF ve Excel export</li>
              <li><CheckCircle size={24} /> Excel'den veri import</li>
              <li><CheckCircle size={24} /> 7/24 teknik destek</li>
            </ul>

            <Link to="/login" className="btn btn-primary btn-large">Hemen Başlayın</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Hemen Başlayın</h2>
          <p>
            Ders programı oluşturmayı zahmetsiz hale getirin. Okuloji'yi deneyin ve saatlerce süren işi dakikalara indirin.
          </p>
          <Link to="/login" className="btn btn-light btn-large">
            Ücretsiz Deneyin <ArrowRight size={20} style={{marginLeft: '8px'}} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <h3>Okuloji</h3>
              <p>Modern ders programı yönetim sistemi</p>
            </div>
            <div className="footer-column">
              <h4>Ürün</h4>
              <a href="#ozellikler">Özellikler</a>
              <a href="#fiyatlandirma">Fiyatlandırma</a>
              <a href="#dokumantasyon">Dökümantasyon</a>
            </div>
            <div className="footer-column">
              <h4>Destek</h4>
              <a href="#">Yardım Merkezi</a>
              <a href="#">İletişim</a>
              <a href="#">SSS</a>
            </div>
            <div className="footer-column">
              <h4>Yasal</h4>
              <a href="#">Gizlilik Politikası</a>
              <a href="#">Kullanım Koşulları</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Okuloji. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home