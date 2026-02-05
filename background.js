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

function getImageUrlFromRightClickTarget() {
  const x = parseFloat(document.documentElement.dataset.lastContextX);
  const y = parseFloat(document.documentElement.dataset.lastContextY);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  if (el.tagName === 'IMG') return el.src;
  const parent = el.parentElement;
  if (parent) {
    const img = parent.querySelector('img');
    if (img) return img.src;
  }
  return null;
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getImageUrlFromRightClickTarget
  }).then((coordResults) => {
    const urlFromPoint = coordResults?.[0]?.result ?? null;
    const clickedImageUrl = urlFromPoint || info.srcUrl || null;
    return chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['imageFinder.js']
    }).then(() => {
      return chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (url, cdnDomain) => {
          if (typeof findInstagramImage === 'function') {
            return findInstagramImage(url, cdnDomain);
          }
          return null;
        },
        args: [clickedImageUrl, CDN_DOMAIN]
      });
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
