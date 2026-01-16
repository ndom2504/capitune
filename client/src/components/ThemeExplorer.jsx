import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import './ThemeExplorer.css';

function ThemeExplorer({ profile }) {
  const themes = [
    { name: 'Intelligence artificielle', frequency: 15, color: '#D4A574' },
    { name: 'Éthique', frequency: 12, color: '#8B7355' },
    { name: 'Psychologie', frequency: 10, color: '#A8A299' },
    { name: 'Entrepreneuriat', frequency: 8, color: '#D4C9BC' },
    { name: 'Philosophie', frequency: 7, color: '#E8E0D5' }
  ];

  const maxFreq = Math.max(...themes.map(t => t.frequency));

  return (
    <div className="theme-explorer">
      <h3 className="themes-header">
        <TrendingUp size={18} />
        Explorations thématiques
      </h3>
      <div className="themes-timeline">
        {themes.map((theme, index) => (
          <motion.div
            key={theme.name}
            className="theme-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="theme-bar-container">
              <span className="theme-label">{theme.name}</span>
              <div className="theme-bar">
                <motion.div
                  className="theme-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(theme.frequency / maxFreq) * 100}%` }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.6 }}
                  style={{ backgroundColor: theme.color }}
                />
              </div>
              <span className="theme-count">{theme.frequency}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ThemeExplorer;
