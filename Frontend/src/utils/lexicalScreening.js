import phishingPatterns from "./PhishingPatterns.js";

export function lexicalRiskScore(text) {
  let score = 0;
  const lower = text.toLowerCase();

  // keyword scoring
  phishingPatterns.suspicious_keywords.forEach(k => {
    if (lower.includes(k)) score += 2;
  });

  phishingPatterns.persuasion_patterns.forEach(k => {
    if (lower.includes(k)) score += 1;
  });

  // regex confidence boost
  phishingPatterns.regex_indicators.forEach(reg => {
    if (reg.test(text)) score += 4;
  });

  return score;
}

// heuristic evaluation output
export function heuristicClassification(text) {
  const score = lexicalRiskScore(text);

  if (score >= 6) return { risk: "high", msg: "Strong phishing indicators detected" };
  if (score >= 3) return { risk: "medium", msg: "Suspicious phrasing observed" };

  return { risk: "benign", msg: "" };
}
