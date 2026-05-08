
import { useState } from "react";
import "./App.css";
import heroImage from "./assets/hero.jpg";

function App() {
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    {
      name: "Car Key Programming",
      icon: "🔑",
      description:
        "Programming and replacement of smart keys, transponder keys, and push-start systems.",
    },
    {
      name: "Key Fob Replacement",
      icon: "🚗",
      description:
        "Replacement and setup of lost, damaged, or malfunctioning remote key fobs.",
    },
    {
      name: "ECU Programming",
      icon: "🧠",
      description:
        "Advanced ECU coding, flashing, and programming for multiple vehicle brands.",
    },
    {
      name: "TPMS Services",
      icon: "🛞",
      description:
        "Tire pressure sensor diagnostics, replacement, and reset services.",
    },
    {
      name: "Car Diagnostics",
      icon: "🔍",
      description:
        "Professional automotive diagnostics using advanced scanning tools.",
    },
    {
      name: "Airbag Services",
      icon: "🛡️",
      description:
        "Airbag module diagnostics, reset, repair support, and safety inspections.",
    },
    {
      name: "Rekey & Lock Change",
      icon: "🔐",
      description:
        "Vehicle rekeying and lock replacement for improved security.",
    },
    {
      name: "Car Lockout Assistance",
      icon: "🚘",
      description:
        "Fast emergency vehicle lockout assistance across Atlanta and nearby areas.",
    },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <h1 className="logo">GABNIKS MOTORS</h1>

          <div className="header-buttons">
            <a href="tel:+16787490856" className="icon-button call-btn">
              📞
            </a>

            <a
              href="https://wa.me/16787490856?text=Hello%20Gabniks%20Motors%2C%20I%20need%20help%20with%20my%20vehicle."
              target="_blank"
              rel="noreferrer"
              className="icon-button whatsapp-btn"
            >
              💬
            </a>

            <a
              href="https://www.facebook.com/share/1NcLo3imz7/"
              target="_blank"
              rel="noreferrer"
              className="icon-button facebook-btn"
            >
              f
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="section-container">
            <div className="hero-badge">
              Trusted Automotive Locksmith & Diagnostic Specialists
            </div>

            <h1 className="hero-title">
              Fast. Reliable. Professional Automotive Solutions.
            </h1>

            <p className="hero-description">
              Gabniks Motors & Tech LLC provides modern automotive locksmith,
              diagnostics, ECU programming, TPMS service, airbag support, and
              emergency lockout assistance. We help drivers stay safe, secure,
              and back on the road quickly with dependable mobile service.
            </p>

            <div className="hero-features">
              <div className="feature-card">
                <h3>Mobile Service</h3>
                <p>Fast on-site assistance across Atlanta, Cobb, and Marietta.</p>
              </div>

              <div className="feature-card">
                <h3>Advanced Diagnostics</h3>
                <p>Professional tools for modern vehicle technology issues.</p>
              </div>

              <div className="feature-card">
                <h3>Trusted Support</h3>
                <p>Reliable service focused on safety, speed, and quality.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="image-section">
          <div className="section-container">
            <div className="hero-image-card">
              <img src={heroImage} alt="Gabniks Motors" className="hero-image" />
            </div>
          </div>
        </section>

        <section className="services-section">
          <div className="section-container">
            <h2 className="section-title">Our Services</h2>

            <div className="services-grid">
              {services.map((service) => (
                <button
                  key={service.name}
                  className="service-card"
                  onClick={() => setSelectedService(service)}
                >
                  <span className="service-icon">{service.icon}</span>
                  <span className="service-title">{service.name}</span>
                  <span className="service-subtitle">Click to book service</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="map-section">
          <div className="section-container">
            <h2 className="section-title">Service Area</h2>

            <p className="map-text">
              Serving Atlanta, Cobb, Marietta, and nearby areas with mobile
              automotive locksmith, diagnostics, ECU programming, TPMS service,
              and emergency vehicle assistance.
            </p>

            <div className="map-frame">
              <iframe
                src="https://www.google.com/maps?q=Atlanta,Georgia&output=embed"
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title="Gabniks Motors Service Area"
              ></iframe>
            </div>
          </div>
        </section>
      </main>

      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedService(null)}
            >
              ×
            </button>

            <h2 className="booking-title">Book: {selectedService.name}</h2>

            <p className="booking-description">{selectedService.description}</p>

            <form
              action="https://formspree.io/f/meenlrgy"
              method="POST"
              className="booking-form"
            >
              <input type="hidden" name="Service Requested" value={selectedService.name} />

              <input type="text" name="Full Name" placeholder="Full Name" required />
              <input type="tel" name="Phone Number" placeholder="Phone Number" required />
              <input type="email" name="Email" placeholder="Email Address" required />
              <input type="text" name="Car Make" placeholder="Car Make" required />
              <input type="text" name="Car Model" placeholder="Car Model" required />
              <input type="text" name="Car Year" placeholder="Car Year" required />
              <input type="text" name="Location" placeholder="Vehicle Location / Address" required />
              <input type="date" name="Preferred Date" required />
              <input type="time" name="Preferred Time" required />

              <textarea
                name="Issue Description"
                placeholder="Describe the issue in detail"
                rows="5"
                required
              ></textarea>

              <button type="submit" className="submit-btn">
                Submit Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      <a
        href="https://wa.me/16787490856?text=Hello%20Gabniks%20Motors%2C%20I%20need%20help%20with%20my%20vehicle."
        target="_blank"
        rel="noreferrer"
        className="floating-whatsapp"
      >
        💬
      </a>

      <footer className="footer">
        <p>© 2026 Gabniks Motors & Tech LLC • +1 (678) 749-0856</p>
      </footer>
    </div>
  );
}

export default App;