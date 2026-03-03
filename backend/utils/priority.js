/**
 * Computes priority score for complaints based on multiple factors
 * @param {Object} params - Priority computation parameters
 * @param {string} params.urgency - 'low'|'medium'|'high'
 * @param {string} params.sentiment - 'angry'|'neutral'|'positive'
 * @param {number} params.recurrenceCount - Number of similar complaints
 * @param {boolean} params.locationSensitivity - Whether location is critical
 * @returns {number} Priority score between 0 and 1
 */
function computePriorityScore({ urgency, sentiment, recurrenceCount = 0, locationSensitivity = false }) {
  // Base score from urgency
  let base = 0.3;
  if (urgency === 'high') {
    base = 1.0;
  } else if (urgency === 'medium') {
    base = 0.6;
  }

  // Sentiment boost/penalty
  let sentimentBoost = 0;
  if (sentiment === 'angry') {
    sentimentBoost = 0.2;
  } else if (sentiment === 'neutral') {
    sentimentBoost = 0.0;
  } else if (sentiment === 'positive') {
    sentimentBoost = -0.05;
  }

  // Recurrence factor (more complaints = higher priority)
  const recurrenceFactor = Math.min(recurrenceCount * 0.05, 0.2);

  // Location sensitivity factor
  const locationFactor = locationSensitivity ? 0.1 : 0;

  // Calculate final score
  let score = base + sentimentBoost + recurrenceFactor + locationFactor;

  // Normalize to 0-1 range
  score = Math.max(0, Math.min(1, score));

  // Return as float with 2 decimal places
  return Math.round(score * 100) / 100;
}

module.exports = {
  computePriorityScore
};
