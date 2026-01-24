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

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (clickedImageUrl, cdnDomain) => {
      let imageUrl = null;
      
      if (clickedImageUrl?.includes(cdnDomain)) {
        imageUrl = clickedImageUrl;
      } else {
        const containers = document.querySelectorAll('div._aagu img');
        let largest = null;
        let largestArea = 0;
        
        for (const img of containers) {
          if (!img.src.includes(cdnDomain)) continue;
          const rect = img.getBoundingClientRect();
          const area = rect.width * rect.height;
          if (area > largestArea) {
            largestArea = area;
            largest = img;
          }
        }
        
        if (largest) {
          imageUrl = largest.src;
        } else {
          const fallback = document.querySelector(`img[src*="${cdnDomain}"]`);
          imageUrl = fallback?.src || null;
        }
      }
      
      return imageUrl;
    },
    args: [info.srcUrl || null, CDN_DOMAIN]
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
