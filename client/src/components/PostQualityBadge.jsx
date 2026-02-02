import { Award, AlertCircle } from 'lucide-react';
import './PostQualityBadge.css';

function PostQualityBadge({ post }) {
  // Calcul simplifié du score de qualité
  // À améliorer avec un vrai système en backend
  const calculateQualityScore = (post) => {
    let score = 0;
    let maxScore = 0;

    // Contenu (longueur) - 0-3 points
    maxScore += 3;
    if (post.content?.length > 500) score += 3;
    else if (post.content?.length > 200) score += 2;
    else if (post.content?.length > 50) score += 1;

    // Structure (tags) - 0-2 points
    maxScore += 2;
    if (post.tags?.length >= 3) score += 2;
    else if (post.tags?.length > 0) score += 1;

    // Engagement positif (likes - simplified) - 0-2 points
    maxScore += 2;
    if (post.likesCount > 5) score += 2;
    else if (post.likesCount > 0) score += 1;

    // Commentaires - 0-2 points
    maxScore += 2;
    if (post.commentsCount > 2) score += 2;
    else if (post.commentsCount > 0) score += 1;

    // Média (richesse) - 0-1 point
    maxScore += 1;
    if (post.media?.length > 0) score += 1;

    const percentage = Math.round((score / maxScore) * 100);
    return { score: percentage, level: getQualityLevel(percentage) };
  };

  const getQualityLevel = (score) => {
    if (score >= 85) return { label: 'Exceptionnel', color: '#D4A574' };
    if (score >= 70) return { label: 'Excellent', color: '#8B7355' };
    if (score >= 55) return { label: 'Bon', color: '#A8A299' };
    if (score >= 40) return { label: 'Correct', color: '#D4C9BC' };
    return { label: 'À développer', color: '#E8E0D5' };
  };

  const { score, level } = calculateQualityScore(post);

  return (
    <div className="post-quality-badge">
      <div className="quality-content">
        {score >= 55 ? (
          <Award size={16} className="quality-icon" style={{ color: level.color }} />
        ) : (
          <AlertCircle size={16} className="quality-icon" style={{ color: level.color }} />
        )}
        <span className="quality-label">{level.label}</span>
        <span className="quality-score" style={{ color: level.color }}>{score}%</span>
      </div>
    </div>
  );
}

export default PostQualityBadge;
