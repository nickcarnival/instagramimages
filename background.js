// Background service worker
const CONTEXT_MENU_ID = "instagram-parse-image";
const INSTAGRAM_DOMAIN = "https://www.instagram.com/*";
const CDN_DOMAIN = "cdninstagram.com";

function createContextMenu() {
  console.log('Creating context menu...');
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Open Instagram Image",
      contexts: ["page", "selection", "link", "image"],
      documentUrlPatterns: [INSTAGRAM_DOMAIN]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating context menu:', chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  createContextMenu();
});
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension startup');
  createContextMenu();
});
console.log('Background script loaded');
createContextMenu();

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked!', { menuItemId: info.menuItemId, tabId: tab?.id, srcUrl: info.srcUrl });
  
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    console.log('Early return - wrong menu item or no tab');
    return;
  }

  console.log('Executing script to find image...');
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (clickedImageUrl, cdnDomain) => {
      console.log('Script executing on page', { clickedImageUrl, cdnDomain });
      let imageUrl = null;
      
      if (clickedImageUrl?.includes(cdnDomain)) {
        console.log('Using clicked image URL directly');
        imageUrl = clickedImageUrl;
      } else {
        console.log('Searching for images in _aagu containers...');
        const containers = document.querySelectorAll('div._aagu img');
        console.log(`Found ${containers.length} images in _aagu containers`);
        
        let largest = null;
        let largestArea = 0;
        
        for (const img of containers) {
          if (!img.src.includes(cdnDomain)) continue;
          const rect = img.getBoundingClientRect();
          const area = rect.width * rect.height;
          console.log('Image found:', { src: img.src, area });
          if (area > largestArea) {
            largestArea = area;
            largest = img;
          }
        }
        
        if (largest) {
          console.log('Using largest image:', largest.src);
          imageUrl = largest.src;
        } else {
          console.log('No image in containers, searching all images...');
          const fallback = document.querySelector(`img[src*="${cdnDomain}"]`);
          imageUrl = fallback?.src || null;
          console.log('Fallback result:', imageUrl);
        }
      }
      
      console.log('Final imageUrl:', imageUrl);
      return imageUrl;
    },
    args: [info.srcUrl || null, CDN_DOMAIN]
  }).then((results) => {
    console.log('Script execution result:', results);
    const imageUrl = results[0]?.result;
    console.log('Extracted imageUrl:', imageUrl);
    
    if (imageUrl) {
      const pageUrl = chrome.runtime.getURL(`page.html?imageUrl=${encodeURIComponent(imageUrl)}`);
      console.log('Opening page:', pageUrl);
      chrome.tabs.create({ url: pageUrl });
    } else {
      console.log('No image URL found, showing alert');
      if (tab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert('No Instagram image found!')
        });
      }
    }
  }).catch((err) => {
    console.error('Error in context menu handler:', err);
  });
});
