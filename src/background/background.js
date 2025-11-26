// On install or startup, check if authenticated
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('pages/auth/auth.html') });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CALIBRATION_COMPLETE') {
    console.log('!!Calibration completed');
    
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