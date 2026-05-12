import "./App.css";
import logo from "./assets/Gabnik_logo.png";
import hero from "./assets/hero.jpg";

function App() {
  const services = [
    {
      icon: "🔑",
      title: "Car Key Programming",
      text: "Professional key programming for modern vehicles.",
    },
    {
      icon: "🚗",
      title: "Key Fob Replacement",
      text: "Replacement and setup for lost or damaged key fobs.",
    },
    {
      icon: "🧠",
      title: "ECU Programming",
      text: "Advanced ECU programming and vehicle module support.",
    },
    {
      icon: "🛞",
      title: "TPMS Services",
      text: "Tire pressure sensor programming and replacement.",
    },
    {
      icon: "🔍",
      title: "Car Diagnostics",
      text: "Accurate diagnostics for warning lights and vehicle issues.",
    },
    {
      icon: "🛡️",
      title: "Airbag Services",
      text: "Airbag system scanning and diagnostic support.",
    },
    {
      icon: "🔐",
      title: "Rekey & Lock Change",
      text: "Vehicle lock rekeying and secure lock replacement.",
    },
    {
      icon: "🚘",
      title: "Car Lockout Assistance",
      text: "Fast emergency help when you are locked out.",
    },
  ];

  const faqs = [
    {
      question: "Do you offer mobile automotive locksmith service?",
      answer:
        "Yes. Gabniks Motors provides mobile automotive locksmith and diagnostic support across Atlanta, Cobb, Marietta, and nearby areas.",
    },
    {
      question: "Can I book a service online?",
      answer:
        "Yes. Select any service card and complete the booking form. The request will be sent directly for follow-up.",
    },
    {
      question: "Do you handle emergency lockouts?",
      answer:
        "Yes. For urgent lockout situations, customers should use the call or WhatsApp button for faster response.",
    },
    {
      question: "Do you work on key fobs and smart keys?",
      answer:
        "Yes. Services include key fob replacement, smart key programming, transponder keys, and push-start system support.",
    },
  ];

  return (
    <div className="app" id="top">
      {/* =========================================================
         HEADER
      ========================================================= */}

      <header className="header">
        <div className="header-container">
          <a href="#top" className="logo">
            <img
              src={logo}
              alt="Gabniks Motors & Tech LLC"
              className="logo-image"
            />
          </a>

          <nav className="nav-links">
            <a href="#top">Home</a>
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#gallery">Gallery</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="header-icons">
            <a href="tel:+16787490856" className="icon-circle phone-icon">
              ☎
            </a>

            <a
              href="https://wa.me/16787490856"
              className="icon-circle message-icon"
              target="_blank"
              rel="noreferrer"
            >
              💬
            </a>

            <a
              href="https://facebook.com"
              className="icon-circle facebook-icon"
              target="_blank"
              rel="noreferrer"
            >
              f
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================
         HERO SECTION
      ========================================================= */}

      <section className="hero-section">
        <div className="hero-background">
          <img src={hero} alt="Gabniks automotive services" />
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-content">
          <p className="hero-label">
            Trusted Automotive Locksmith & Diagnostic Specialists
          </p>

          <h1>Fast. Reliable. Professional Automotive Solutions.</h1>

          <p className="hero-text">
            Gabniks Motors & Tech LLC provides mobile automotive locksmith,
            diagnostics, ECU programming, TPMS service, airbag support, and
            emergency lockout assistance.
          </p>

          <div className="hero-buttons">
            <a href="#services" className="primary-button">
              Book a Service
            </a>

            <a href="tel:+16787490856" className="secondary-button">
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
         SERVICES SECTION
      ========================================================= */}

      <section id="services" className="section services-section">
        <div className="section-container">
          <p className="section-label">What We Do</p>

          <h2 className="section-title">Our Services</h2>

          <p className="section-description">
            Select a service below to send a booking request directly to Gabniks
            Motors.
          </p>

          <div className="services-grid">
            {services.map((service, index) => (
              <div className="service-card" key={index}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
         ABOUT SECTION
      ========================================================= */}

      <section id="about" className="about-section">
        <div className="about-container">
          <p className="section-label">About Gabniks Motors</p>

          <h2 className="about-title">
            Dependable automotive support when customers need it most.
          </h2>

          <p className="about-text">
            Gabniks Motors & Tech LLC focuses on professional automotive
            locksmith and diagnostic solutions for drivers who need fast,
            reliable, and skilled service. From key programming and vehicle
            diagnostics to TPMS support, airbag services, ECU programming, and
            emergency lockout assistance, the goal is to provide customer-first
            service with care, precision, and professionalism.
          </p>

          <div className="about-features">
            <div>Mobile Automotive Service</div>
            <div>Customer-First Communication</div>
            <div>Modern Diagnostic Support</div>
            <div>Fast Response Assistance</div>
          </div>
        </div>
      </section>

      {/* =========================================================
         FAQ SECTION
      ========================================================= */}

      <section id="faq" className="faq-section">
        <div className="section-container">
          <p className="section-label">Need Help?</p>

          <h2 className="section-title">Frequently Asked Questions</h2>

          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div className="faq-card" key={index}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
         SERVICE AREA SECTION
      ========================================================= */}

      <section id="contact" className="service-area-section">
        <div className="section-container">
          <p className="section-label">Where We Serve</p>

          <h2 className="section-title">Service Area</h2>

          <p className="section-description">
            Serving Atlanta, Cobb, Marietta, and nearby areas with mobile
            automotive locksmith, diagnostics, ECU programming, TPMS service,
            and emergency vehicle assistance.
          </p>

          <div className="service-area-actions">
            <a href="tel:+16787490856" className="service-area-button">
              Call +1 (678) 749-0856
            </a>

            <a
              href="https://wa.me/16787490856"
              className="service-area-button whatsapp"
              target="_blank"
              rel="noreferrer"
            >
              Message on WhatsApp
            </a>
          </div>

          <div className="map-wrapper">
            <iframe
              title="Gabniks Motors Service Area"
              src="https://www.google.com/maps?q=Atlanta,%20GA,%20USA&output=embed"
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>

      {/* =========================================================
         FOOTER
      ========================================================= */}

      <footer className="footer">
        <p>© 2026 Gabniks Motors & Tech LLC • +1 (678) 749-0856</p>
      </footer>

      {/* =========================================================
         FLOATING WHATSAPP BUTTON
      ========================================================= */}

      <a
        href="https://wa.me/16787490856"
        className="floating-whatsapp"
        target="_blank"
        rel="noreferrer"
      >
        💬
      </a>

      {/* =========================================================
         BACK TO TOP BUTTON
      ========================================================= */}

      <a href="#top" className="back-to-top">
        ↑
      </a>
    </div>
  );
}

export default App;