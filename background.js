// Background service worker
const CONTEXT_MENU_ID = "instagram-parse-image";
const INSTAGRAM_DOMAIN = "https://www.instagram.com/*";
const CDN_DOMAIN = "cdninstagram.com";

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Open Instagram Image",
      contexts: ["page", "selection", "link", "image"],
      documentUrlPatterns: [INSTAGRAM_DOMAIN]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => createContextMenu());
chrome.runtime.onStartup.addListener(() => createContextMenu());
createContextMenu();

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;

  // Inject image finder script and execute
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['imageFinder.js']
  }).then(() => {
    return chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (clickedImageUrl, cdnDomain) => {
        if (typeof findInstagramImage === 'function') {
          return findInstagramImage(clickedImageUrl, cdnDomain);
        }
        return null;
      },
      args: [info.srcUrl || null, CDN_DOMAIN]
    });
  }).then((results) => {
    const imageUrl = results[0]?.result;
    
    if (imageUrl) {
      const pageUrl = chrome.runtime.getURL(`page.html?imageUrl=${encodeURIComponent(imageUrl)}`);
      chrome.tabs.create({ url: pageUrl });
    } else if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert('No Instagram image found!')
      });
    }
  }).catch(() => {});
});
