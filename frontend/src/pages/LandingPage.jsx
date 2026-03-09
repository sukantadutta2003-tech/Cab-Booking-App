import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-hero fade-in">
        <div className="hero-badge">🚀 Phase 4 — Full Stack Live</div>
        <h1 className="hero-title">
          Your Ride,<br />
          <span className="gradient-text">On Demand</span>
        </h1>
        <p className="hero-sub">
          Book cabs instantly. Real-time tracking. Secure payments.<br/>
          Built for riders, drivers, and admins.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Get Started →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </div>

      <div className="features fade-in">
        {[
          { icon: '🚖', title: 'Instant Booking', desc: 'Book a ride in seconds with auto-matching to the nearest driver.' },
          { icon: '📍', title: 'Live Tracking', desc: 'Real-time WebSocket updates on your ride status from pickup to drop.' },
          { icon: '💳', title: 'Flexible Payments', desc: 'Pay via Cash, Card, or UPI — confirm after ride completion.' },
          { icon: '⭐', title: 'Rate Your Driver', desc: 'Submit ratings after every ride to keep the platform quality high.' },
          { icon: '🚗', title: 'Driver Dashboard', desc: 'Drivers manage availability, accept rides, and track earnings live.' },
          { icon: '📊', title: 'Admin Insights', desc: 'Platform stats, all rides and users — full visibility for admins.' },
        ].map(f => (
          <div className="feature-card card" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
