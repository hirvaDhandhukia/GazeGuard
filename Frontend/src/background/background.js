// Open auth page on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("pages/auth/auth.html") });
});

// Global message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Handle calibration completion broadcast
  if (request.type === "CALIBRATION_COMPLETE") {
    console.info("[GG] Calibration completed");

    chrome.storage.local.set({ calibrationComplete: true });

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "CALIBRATION_COMPLETED",
        }).catch(() => {});
      });
    });
    return true; // async response
  }

  // Handle backend POST relay
  if (request.type === "fetchLocalhost") {
    console.info("[GG] Relaying API call:", request);

    fetch(request.url, {
      method: request.method || "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.body),
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) =>
        sendResponse({ success: false, error: error.message })
      );

    return true; // keep channel open for async response
  }

  // open dashboard page
  if (request.type === "OPEN_DASHBOARD") {
    console.info("[GG] Opening dashboard tab");

    const dashUrl = chrome.runtime.getURL("pages/dashboard/dashboard.html");

    chrome.tabs.query({}, (tabs) => {
      const existing = tabs.find(
        (tab) => tab.url && tab.url.includes("dashboard.html")
      );

      if (existing) {
        chrome.tabs.update(existing.id, { active: true });
      } else {
        chrome.tabs.create({ url: dashUrl });
      }
    });

    return true;
  }

  return false;
});
