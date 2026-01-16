import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import './CognitiveIndicators.css';

function CognitiveIndicators({ profile }) {
  // Indicateurs calculés (à être générés en backend)
  const indicators = {
    intellectualDiversity: {
      label: 'Diversité intellectuelle',
      value: profile?.cognitiveProfile?.intellectualDiversity || 72,
      description: 'Gamme de thèmes explorés'
    },
    argumentQuality: {
      label: 'Qualité argumentative',
      value: profile?.cognitiveProfile?.argumentQuality || 85,
      description: 'Clarté et profondeur'
    },
    constructiveContributions: {
      label: 'Contributions constructives',
      value: profile?.cognitiveProfile?.constructiveContributions || 68,
      description: 'Apport à la communauté'
    },
    cognitiveGrowth: {
      label: 'Croissance cognitive',
      value: profile?.cognitiveProfile?.cognitiveGrowth || 79,
      description: 'Évolution du profil'
    }
  };

  const topThemes = profile?.cognitiveProfile?.topThemes || ['Philosophie', 'Entrepreneuriat', 'Écologie', 'Apprentissage', 'Créativité'];
  const stimulatingThemes = profile?.cognitiveProfile?.stimulatingThemes || ['Intelligence artificielle', 'Éthique', 'Psychologie cognitive'];
  const qualityBadge = profile?.cognitiveProfile?.qualityBadge || {
    title: 'Penseur analytique',
    description: 'Contributions équilibrées entre analyse et création'
  };

  return (
    <div className="cognitive-indicators">
      <h3 className="indicators-title">🧠 Profil cognitif</h3>
      
      <div className="indicators-grid">
        {Object.entries(indicators).map(([key, indicator], index) => (
          <motion.div
            key={key}
            className="indicator-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="indicator-header">
              <span className="indicator-label">{indicator.label}</span>
              <span className="indicator-value">{indicator.value}%</span>
            </div>
            <div className="indicator-bar">
              <motion.div
                className="indicator-fill"
                initial={{ width: 0 }}
                animate={{ width: `${indicator.value}%` }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              />
            </div>
            <p className="indicator-desc">{indicator.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="themes-section">
        <div className="themes-group">
          <h4>💡 Thèmes qui te stimulent</h4>
          <div className="themes-list">
            {stimulatingThemes.map((theme, i) => (
              <motion.span
                key={i}
                className="theme-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {theme}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="themes-group">
          <h4>📚 Sujets explorés</h4>
          <div className="themes-list">
            {topThemes.map((theme, i) => (
              <motion.span
                key={i}
                className="theme-badge secondary"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {theme}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      <div className="quality-badge">
        <Zap size={20} />
        <div>
          <strong>{qualityBadge.title}</strong>
          <p>{qualityBadge.description}</p>
        </div>
      </div>
    </div>
  );
}

export default CognitiveIndicators;
