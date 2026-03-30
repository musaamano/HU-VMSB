import { useNavigate } from 'react-router-dom';
import huVmsLogo from '../../assets/HU-VMS-logo.png';
import realtimeTrackingImg from '../../assets/realtime tracking.jpg';
import notifyImg from '../../assets/notify.jpg';
import reportsImg from '../../assets/reports.jpg';
import userManagementImg from '../../assets/usermanagement.jpg';
import vmImg from '../../assets/vm.jpg';
import customsImg from '../../assets/customs.jpg';
import './landingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img src={huVmsLogo} alt="HU-VMS Logo" className="logo-icon-img" />
            <span className="logo-text">HU-VMS</span>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('home')} className="nav-link">Home</button>
            <button onClick={() => scrollToSection('about')} className="nav-link">About</button>
            <button onClick={() => scrollToSection('contact')} className="nav-link">Contact</button>
          </div>
          <button onClick={() => navigate('/login')} className="login-btn">
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="highlight">HU Vehicle Management System</span>
            </h1>
            
            {/* Animated Feature Cards */}
            <div className="features-animation-container">
              <div className="features-track">
                <div className="animated-feature-card">
                  <span className="feature-card-icon">📊</span>
                  <span className="feature-card-text">Real-time Tracking</span>
                </div>
                <div className="animated-feature-card">
                  <span className="feature-card-icon">🚙</span>
                  <span className="feature-card-text">Fleet Management</span>
                </div>
                <div className="animated-feature-card">
                  <span className="feature-card-icon">📈</span>
                  <span className="feature-card-text">Analytics & Reports</span>
                </div>
                {/* Duplicate for seamless loop */}
                <div className="animated-feature-card">
                  <span className="feature-card-icon">📊</span>
                  <span className="feature-card-text">Real-time Tracking</span>
                </div>
                <div className="animated-feature-card">
                  <span className="feature-card-icon">🚙</span>
                  <span className="feature-card-text">Fleet Management</span>
                </div>
                <div className="animated-feature-card">
                  <span className="feature-card-icon">📈</span>
                  <span className="feature-card-text">Analytics & Reports</span>
                </div>
              </div>
            </div>
            
            <p className="hero-subtitle">
              Streamline your fleet operations with our comprehensive vehicle management solution. Track vehicles, manage drivers, and generate detailed reports all in one place.
            </p>
            <div className="hero-buttons">
              <button onClick={() => navigate('/login')} className="btn-primary-hero">
                Get Started
              </button>
              <button onClick={() => scrollToSection('about')} className="btn-secondary-hero">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <h2 className="section-title">About Our System</h2>
          <p className="section-subtitle">
            A comprehensive solution for managing university vehicle operations
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-image">
                <img src={vmImg} alt="Vehicle Management" className="feature-image" />
              </div>
              <h3>Vehicle Management</h3>
              <p>Track and manage your entire fleet with ease. Monitor vehicle status, maintenance schedules, and availability in real-time.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon feature-icon-image">
                <img src={userManagementImg} alt="User Management" className="feature-image" />
              </div>
              <h3>User Management</h3>
              <p>Manage drivers, transport officers, and users efficiently. Assign roles and permissions with our intuitive interface.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon feature-icon-image">
                <img src={reportsImg} alt="Advanced Reports" className="feature-image" />
              </div>
              <h3>Advanced Reports</h3>
              <p>Generate detailed reports on trips, fuel consumption, driver performance, and more. Export and share with ease.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon feature-icon-image">
                <img src={realtimeTrackingImg} alt="Real-time Tracking" className="feature-image" />
              </div>
              <h3>Real-time Tracking</h3>
              <p>Track vehicle locations in real-time with our integrated mapping system. Monitor routes and optimize operations.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon feature-icon-image">
                <img src={notifyImg} alt="Notifications" className="feature-image" />
              </div>
              <h3>Notifications</h3>
              <p>Stay informed with instant notifications for requests, approvals, maintenance alerts, and system updates.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon feature-icon-image">
                <img src={customsImg} alt="Customizable" className="feature-image" />
              </div>
              <h3>Customizable</h3>
              <p>Personalize your experience with multiple themes and configurable settings to match your preferences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">
            Have questions? We'd love to hear from you
          </p>
          
          <div className="contact-content">
            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon">📍</div>
                <h3>Address</h3>
                <p>Haramaya University<br/>P.O. Box 138<br/>Dire Dawa, Ethiopia</p>
              </div>
              
              <div className="info-card">
                <div className="info-icon">📧</div>
                <h3>Email</h3>
                <p>transport@haramaya.edu.et<br/>support@hu-vms.edu.et</p>
              </div>
              
              <div className="info-card">
                <div className="info-icon">📞</div>
                <h3>Phone</h3>
                <p>+251 25 553 0325<br/>+251 25 553 0326</p>
              </div>
            </div>
            
            <div className="contact-form">
              <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Subject" required />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" rows="5" required></textarea>
                </div>
                <button type="submit" className="submit-btn">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">
                <span className="footer-icon">🚗</span>
                HU-VMS
              </h3>
              <p className="footer-text">
                Haramaya University Vehicle Management System - Streamlining fleet operations for better efficiency.
              </p>
            </div>
            
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><button onClick={() => scrollToSection('home')}>Home</button></li>
                <li><button onClick={() => scrollToSection('about')}>About</button></li>
                <li><button onClick={() => scrollToSection('contact')}>Contact</button></li>
                <li><button onClick={() => navigate('/login')}>Login</button></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Services</h4>
              <ul className="footer-links">
                <li><a href="#!">Vehicle Tracking</a></li>
                <li><a href="#!">Fleet Management</a></li>
                <li><a href="#!">Driver Management</a></li>
                <li><a href="#!">Reports & Analytics</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contact Info</h4>
              <ul className="footer-links">
                <li>📍 Haramaya University</li>
                <li>📧 transport@haramaya.edu.et</li>
                <li>📞 +251 25 553 0325</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 Haramaya University Vehicle Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
