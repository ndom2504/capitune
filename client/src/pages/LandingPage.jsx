import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, MessageCircle, TrendingUp, Users, Video, Radio, MessageSquare } from 'lucide-react';
import './LandingPage.css';

function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className="landing-new">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <h1 className="header-logo">Capitune</h1>
          <div className="header-actions">
            <Link to="/login" className="btn-ghost">
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero-new">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="hero-headline">
            Where the world connects in English
          </h2>

          <p className="hero-subheading">
            Share your culture. Have real conversations. Make global friends.<br />
            Live in English naturally — no textbooks, just people.
          </p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Link to="/register" className="btn-primary-large">
              Join the world
            </Link>
            <Link to="/feed" className="btn-explore">
              Explore
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-new">
        <div className="footer-content">
          <div className="footer-section">
            <p className="footer-tagline">Capitune — Where the world speaks together.</p>
          </div>
          <div className="footer-links">
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
