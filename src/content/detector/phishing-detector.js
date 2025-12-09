import { handleClassificationRequest } from "./classifier";
import { heuristicClassification } from "../../utils/lexicalScreening.js";

// store Clerk user id
let clerkUserId = null;

const FIXATION_TIME = 1000; // time (ms) the mouse must stay within the fixation radius
const RATE_LIMIT_MS = 2000; // min delay betn two LLM calls
const CACHE_TTL = 1500000; // cache time-to-live for past analyze text

let lastEl = null; // last DOM ele
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

// load user id from chrome storage
chrome.storage.local.get("clerkUserId", (res) => {
  if (res?.clerkUserId) {
    clerkUserId = res.clerkUserId;
    console.info("[GG] Clerk user ID loaded for detector:", clerkUserId);
  } else {
    console.warn("[GG] No clerkUserId found in storage");
  }
});

export function analyze(el) {

  if (!el || !el.textContent?.trim()) {
    lastEl = null;
    fixationStart = null;
    return Promise.reject("[GG] No text to analyze");
  }
  const textContent = el.textContent.toLowerCase().trim();
  if (el !== lastEl) {
    lastEl = el;
    fixationStart = performance.now();
    return Promise.reject(`[GG] Waiting for ${FIXATION_TIME/1000} seconds before triggering analysis`);
  }

  const elapsed = performance.now() - fixationStart;
  if (elapsed < FIXATION_TIME) return Promise.reject(`[GG] Waiting for ${FIXATION_TIME/1000} seconds before triggering analysis`);

  // prevent duplicate calls via hashing
  const h = hashText(textContent);
  cleanup();

  // return cached result
  if (seen.has(h)) return Promise.resolve(cache.get(h));

  // heuristic scan 
  try {
    const heuristic = heuristicClassification(textContent);
    console.info("[GG] Heuristic scan score:", heuristic);
  } catch (err) { console.warn("[GG] Heuristic scan error:", err);}

  // rate limit function to call llm
  const now = Date.now();
  if (now - lastLLMCall < RATE_LIMIT_MS) return Promise.reject(`[GG] Waiting for ${RATE_LIMIT_MS/1000} seconds before calling LLM again`);

  lastLLMCall = now;

  // call LLM
  return handleClassificationRequest(textContent)
  .then((resp)=>{
    if(resp && !resp.error){
      cache.set(h, resp);
      seen.set(h, now);
      return Promise.resolve(resp);
    }
    return Promise.reject(resp);
  }).then((resp)=>{
    if(resp && resp.risk && !resp.error){
      console.info("[GG] Calling API to store response to DB", resp);
      //To Do: call API
      chrome.runtime.sendMessage({ type: "fetchLocalhost", 
        url: `${process.env.BACKEND_URL}${process.env.DATA_ENDPOINT}`, 
        body: {
          id: h,
          request: textContent,
          response: resp, 
          requestUrl: window.location.href,
          clerkId: clerkUserId || null // inject mapped clerk id 
        },
        method: 'POST'
      }, (eventResponse) => {
        if (eventResponse.success) {
          console.info("[GG] Data from localhost:", eventResponse.data);
        } else {
          console.error("[GG] Error fetching from localhost:", eventResponse.error);
        }
      });
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