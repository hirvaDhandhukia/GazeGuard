(function() {
  console.log('Popup loaded');

  const openAuthTab = () => {
    console.log('Opening auth in new tab...');
    
    const authUrl = chrome.runtime.getURL('/pages/auth/auth.html');
    
    chrome.tabs.create({
      url: authUrl,
      active: true
    }, (tab) => {
      console.log('✓ Auth tab opened');
      // close popup after brief delay
      setTimeout(() => window.close(), 100);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openAuthTab);
  } else {
    openAuthTab();
  }
})();
