// chatEngine.js - Core response engine (replaceable with AI later)
import { findIntent, extractMode } from './intentDetector.js';

let dataset = null;

async function loadDataset() {
  if (dataset) return dataset;
  const res = await fetch('./data/faq.json');
  dataset = await res.json();
  return dataset;
}

function buildHTML(entry) {
  const { short, points, examples } = entry.responses;
  return `
<p class="bot-short">${short}</p>
<ul class="bot-points">
  ${points.map(p => `<li>${p}</li>`).join('\n  ')}
</ul>
<p class="bot-examples-label"><b>📌 Examples:</b></p>
<ul class="bot-examples">
  ${examples.map(e => `<li>${e}</li>`).join('\n  ')}
</ul>`.trim();
}

export async function getBotResponse(userInput, context = {}) {
  const data = await loadDataset();
  const mode = extractMode(userInput);
  let newContext = { ...context };

  // Context: pronoun reference
  const pronouns = ['it', 'this', 'that', 'they', 'them', 'explain it', 'tell me more'];
  const isPronounc = pronouns.some(p => userInput.toLowerCase().trim() === p || userInput.toLowerCase().includes(p));
  
  let intent = null;
  if (isPronounc && newContext.lastIntent) {
    intent = newContext.lastIntent;
  } else {
    intent = findIntent(userInput, data);
  }

  if (!intent) {
    return {
      html: `<p class="bot-short">Sorry, I didn't understand. Try asking about <b>Operating Systems</b>, <b>DBMS</b>, <b>Networking</b>, <b>Programming</b>, <b>Data Structures</b>, or <b>Software Engineering</b>.</p>`,
      newContext
    };
  }

  const entry = data.find(d => d.intent === intent);
  if (!entry) {
    return { html: `<p>I couldn't retrieve data for that topic. Please try again.</p>`, newContext };
  }

  newContext.lastIntent = intent;

  // Mode-based response
  if (mode === 'short') {
    return { html: `<p class="bot-short">${entry.responses.short}</p>`, newContext };
  }
  if (mode === 'points') {
    return {
      html: `<ul class="bot-points">${entry.responses.points.map(p => `<li>${p}</li>`).join('')}</ul>`,
      newContext
    };
  }
  if (mode === 'examples') {
    return {
      html: `<p class="bot-examples-label"><b>📌 Examples for ${entry.intent.replace(/_/g,' ')}:</b></p><ul class="bot-examples">${entry.responses.examples.map(e => `<li>${e}</li>`).join('')}</ul>`,
      newContext
    };
  }

  // Default: full structured response
  return { html: buildHTML(entry), newContext };
}
