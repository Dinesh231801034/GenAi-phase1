// intentDetector.js - Keyword + Fuzzy (Levenshtein) Intent Engine

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i][j-1], dp[i-1][j]);
  return dp[m][n];
}

export function normalize(input) {
  return input.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function findIntent(userInput, dataset) {
  const norm = normalize(userInput);
  const words = norm.split(' ');

  // Pass 1: exact substring match
  for (const entry of dataset) {
    for (const kw of entry.keywords) {
      if (norm.includes(normalize(kw))) return entry.intent;
    }
  }

  // Pass 2: fuzzy per-word match
  let best = null, bestScore = Infinity;
  for (const entry of dataset) {
    for (const kw of entry.keywords) {
      const nkw = normalize(kw);
      const kwWords = nkw.split(' ');
      if (kwWords.length === 1) {
        for (const w of words) {
          if (w.length < 3) continue;
          const d = levenshtein(w, nkw);
          if (d <= 2 && d < bestScore) { bestScore = d; best = entry.intent; }
        }
      } else {
        const d = levenshtein(norm, nkw);
        const threshold = Math.max(3, Math.floor(nkw.length * 0.3));
        if (d <= threshold && d < bestScore) { bestScore = d; best = entry.intent; }
      }
    }
  }
  return best;
}

export function extractMode(input) {
  const l = input.toLowerCase();
  if (/explain|detail|elaborate|describe/.test(l)) return 'detailed';
  if (/in short|brief|summary|summarize/.test(l)) return 'short';
  if (/point|list|numbered/.test(l)) return 'points';
  if (/example|instance|show me/.test(l)) return 'examples';
  return 'default';
}
