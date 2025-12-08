const phishingPatterns = {
  suspicious_keywords: [
    "urgent","verify","suspended","unusual activity","confirm identity",
    "reset password","update payment","account locked","click here","security alert",
    "invoice attached","prize","winner","congratulations","free","claim now"
  ],

  // soft NLP flags
  persuasion_patterns: [
    "limited time",
    "act now",
    "don't miss",
    "exclusive offer",
    "take action"
  ],

  // high-confidence phishing signal (regex level)
  regex_indicators: [
    /\baccount\b.*\blocked\b/i,
    /\bverify\b.*(now|immediately)/i,
    /(click|act).*here/i,
    /(payment|bill).*(required|due)/i
  ]
};

export default phishingPatterns;
