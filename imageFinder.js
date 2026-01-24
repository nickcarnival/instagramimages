// Image finding logic for Instagram
function findInstagramImage(clickedImageUrl, cdnDomain) {
  let imageUrl = null;
  
  // Helper function to check if image is visible
  function isImageVisible(img) {
    if (!img || !img.src.includes(cdnDomain)) return false;
    const rect = img.getBoundingClientRect();
    const style = window.getComputedStyle(img);
    return rect.width > 50 && rect.height > 50 && 
           style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }
  
  // Helper function to climb up the tree and find images
  function findImageInTree(element) {
    if (!element) return null;
    
    let current = element;
    let bestImage = null;
    let bestArea = 0;
    
    // Climb up the tree, checking each level for images
    while (current && current !== document.body) {
      // Check if current element is an image
      if (current.tagName === 'IMG' && isImageVisible(current)) {
        const rect = current.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area > bestArea) {
          bestArea = area;
          bestImage = current;
        }
      }
      
      // Look for images in _aagu containers (grid view) or _aato containers (detail/carousel view)
      const containers = current.querySelectorAll('div._aagu, div._aagu._aato');
      for (const container of containers) {
        const img = container.querySelector('img');
        if (isImageVisible(img)) {
          const rect = img.getBoundingClientRect();
          const area = rect.width * rect.height;
          if (area > bestArea) {
            bestArea = area;
            bestImage = img;
          }
        }
      }
      
      // For carousel views, find the active/visible slide
      const carouselItems = current.querySelectorAll('li._acaz');
      for (const item of carouselItems) {
        const rect = item.getBoundingClientRect();
        const style = window.getComputedStyle(item);
        // Check if this carousel item is visible (not transformed off-screen)
        const transform = style.transform;
        const isVisible = rect.width > 0 && rect.height > 0 &&
                         style.display !== 'none' &&
                         style.visibility !== 'hidden' &&
                         (transform === 'none' || !transform.includes('translateX(-') || transform.includes('translateX(0'));
        
        if (isVisible) {
          const img = item.querySelector('img');
          if (isImageVisible(img)) {
            const imgRect = img.getBoundingClientRect();
            const area = imgRect.width * imgRect.height;
            if (area > bestArea) {
              bestArea = area;
              bestImage = img;
            }
          }
        }
      }
      
      current = current.parentElement;
    }
    
    return bestImage;
  }
  
  // If we have a clicked image URL, try to find that element first
  if (clickedImageUrl?.includes(cdnDomain)) {
    // Try to find the clicked image element
    const clickedImages = document.querySelectorAll(`img[src*="${cdnDomain}"]`);
    for (const img of clickedImages) {
      // Match by URL (handle query params and encoding)
      const imgUrl = img.src.split('?')[0];
      const clickedUrl = clickedImageUrl.split('?')[0];
      if (imgUrl === clickedUrl || img.src === clickedImageUrl) {
        const foundImage = findImageInTree(img);
        if (foundImage) {
          return foundImage.src;
        }
        // If found element itself is good, use it
        if (isImageVisible(img)) {
          return img.src;
        }
      }
    }
    // If we can't find the element but have a valid URL, use it
    imageUrl = clickedImageUrl;
  }
  
  // If we still don't have an image, search for the best visible image
  if (!imageUrl) {
    // Find all _aagu containers (works for both grid and detail views)
    const containers = document.querySelectorAll('div._aagu, div._aagu._aato');
    let bestImage = null;
    let bestArea = 0;
    
    for (const container of containers) {
      const img = container.querySelector('img');
      if (!isImageVisible(img)) continue;
      
      const rect = img.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);
      
      // Additional visibility check for container
      if (containerStyle.display === 'none' || containerStyle.visibility === 'hidden') {
        continue;
      }
      
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        bestImage = img;
      }
    }
    
    if (bestImage) {
      imageUrl = bestImage.src;
    } else {
      // Final fallback: find any visible CDN image
      const allImages = document.querySelectorAll(`img[src*="${cdnDomain}"]`);
      for (const img of allImages) {
        if (isImageVisible(img)) {
          imageUrl = img.src;
          break;
        }
      }
    }
  }
  
  return imageUrl;
}
