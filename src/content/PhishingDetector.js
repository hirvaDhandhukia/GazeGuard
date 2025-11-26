import phishingPatterns from '../utils/PhishingPatterns.js';

// keyword-based detection 
class PhishingDetector {
  score(el) {
    if (!el || !el.textContent) return 0;

    const text = el.textContent.toLowerCase();
    let score = 0;

    phishingPatterns.suspicious_keywords.forEach(word => {
      if (text.includes(word)) score++;
    });

    return score; // return score (0,1,2,...)
  }
}

export default PhishingDetector;
