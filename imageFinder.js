function findInstagramImage(clickedImageUrl, cdnDomain) {
  let imageUrl = null;
  
  function isImageVisible(img) {
    if (!img || !img.src.includes(cdnDomain)) return false;
    const rect = img.getBoundingClientRect();
    const style = window.getComputedStyle(img);
    return rect.width > 50 && rect.height > 50 && 
           style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }
  
  function findImageInTree(element) {
    if (!element) return null;
    
    let current = element;
    let bestImage = null;
    let bestArea = 0;
    
    while (current && current !== document.body) {
      if (current.tagName === 'IMG' && isImageVisible(current)) {
        const rect = current.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area > bestArea) {
          bestArea = area;
          bestImage = current;
        }
      }
      
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
      
      const carouselItems = current.querySelectorAll('li._acaz');
      for (const item of carouselItems) {
        const rect = item.getBoundingClientRect();
        const style = window.getComputedStyle(item);
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
  
  if (clickedImageUrl?.includes(cdnDomain)) {
    const clickedImages = document.querySelectorAll(`img[src*="${cdnDomain}"]`);
    for (const img of clickedImages) {
      const imgUrl = img.src.split('?')[0];
      const clickedUrl = clickedImageUrl.split('?')[0];
      if (imgUrl === clickedUrl || img.src === clickedImageUrl) {
        const foundImage = findImageInTree(img);
        if (foundImage) {
          return foundImage.src;
        }
        if (isImageVisible(img)) {
          return img.src;
        }
      }
    }
    imageUrl = clickedImageUrl;
  }
  
  if (!imageUrl) {
    const containers = document.querySelectorAll('div._aagu, div._aagu._aato');
    let bestImage = null;
    let bestArea = 0;
    
    for (const container of containers) {
      const img = container.querySelector('img');
      if (!isImageVisible(img)) continue;
      
      const rect = img.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);
      
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
