// On install or startup, check if authenticated
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('pages/auth/auth.html') });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CALIBRATION_COMPLETE') {
    console.info('Calibration completed');
    
    // Save flag
    chrome.storage.local.set({ calibrationComplete: true });
    
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CALIBRATION_COMPLETED'
        }).catch(() => {});
      });
    });
  }
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "fetchLocalhost") {
    console.info("[GG] Storing user in db", request);
    fetch(request.url, {
      method: request.method,
      body: JSON.stringify(request.body),
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates that sendResponse will be called asynchronously
  }
});