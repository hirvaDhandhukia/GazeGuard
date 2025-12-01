import { handleClassificationRequest } from "./classifier";

const FIXATION_TIME = 2000; // time (ms) the mouse must stay within the fixation radius
const FIXATION_RADIUS = 60; // max distance (px) between gaze points for the same target
const RATE_LIMIT_MS = 5000; // min delay betn two LLM calls
const CACHE_TTL = 1500000; // cache time-to-live for past analyze text

let lastEl = null; // last DOM ele
let lastX = null; 
let lastY = null;
let fixationStart = null; // user started fixating on current ele 
let lastLLMCall = 0; // llm rate limiter

const seen = new Map();
const cache = new Map();

// cache cleanup
function cleanup() {
  const now = Date.now();
  for (const [h, t] of seen.entries()) {
    // result oler than TTL
    if (now - t > CACHE_TTL){
      seen.delete(h);
      cache.delete(h);
    }
  }
}

export function analyze(el) {

  if (!el || !el.textContent?.trim()) {
    lastEl = null;
    fixationStart = null;
    return Promise.reject("[GG] No text to analyze");
  }

  if (el !== lastEl) {
    lastEl = el;
    fixationStart = performance.now();
    return Promise.reject(`[GG] Waiting for ${FIXATION_TIME/1000} seconds before triggering analysis`);
  }

  const elapsed = performance.now() - fixationStart;
  if (elapsed < FIXATION_TIME) return Promise.reject(`[GG] Waiting for ${FIXATION_TIME/1000} seconds before triggering analysis`);

  // prevent duplicate calls via hashing
  const raw = el.textContent.trim();
  const h = hashText(raw);
  cleanup();

  // return cached result
  if (seen.has(h)) return Promise.resolve(cache.get(h));

  // rate limit function to call llm
  const now = Date.now();
  if (now - lastLLMCall < RATE_LIMIT_MS) return Promise.reject(`[GG] Waiting for ${RATE_LIMIT_MS/1000} seconds before calling LLM again`);

  lastLLMCall = now;
  seen.set(h, now);

  // call LLM
  return handleClassificationRequest(el.textContent.toLowerCase())
  .then((resp)=>{
    if(resp && !resp.error){
      cache.set(h, resp);
      return Promise.resolve(resp);
    }
    return Promise.reject(resp);
  });
}

// FNV-1a hash function for duplicates
export function hashText(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}