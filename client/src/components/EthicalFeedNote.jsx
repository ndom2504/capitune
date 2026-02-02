import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './EthicalFeedNote.css';

/**
 * EthicalFeedNote
 * Affiche un message expliquant les choix éthiques du feed Capitune
 */
function EthicalFeedNote() {
  return (
    <motion.div 
      className="ethical-feed-note"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="note-header">
        <AlertCircle size={18} />
        <h3>À propos de ce fil</h3>
      </div>
      <div className="note-content">
        <p>
          <strong>Capitune n'a pas de scroll infini.</strong> Le fil est limité et 
          organisé par <em>qualité</em> plutôt que par <em>engagement</em>. Nous croyons 
          que votre temps vaut mieux que de l'être exploité par un algorithme addictif.
        </p>
        <ul>
          <li>✅ Pas de notifications agressives</li>
          <li>✅ Pas de compteurs de likes ou followers</li>
          <li>✅ Pas de contenu sensationnaliste priorisé</li>
          <li>✅ Contenu trié par clarté, profondeur et originalité</li>
        </ul>
      </div>
    </motion.div>
  );
}

export default EthicalFeedNote;
