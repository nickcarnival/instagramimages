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
  
  function getImageArea(img) {
    if (!img) return 0;
    const rect = img.getBoundingClientRect();
    return rect.width * rect.height;
  }
  
  function updateBestImage(currentBest, currentArea, candidate) {
    if (!candidate || !isImageVisible(candidate)) return { best: currentBest, area: currentArea };
    const area = getImageArea(candidate);
    if (area > currentArea) {
      return { best: candidate, area };
    }
    return { best: currentBest, area: currentArea };
  }
  
  function findInGridContainers(element) {
    const containers = element.querySelectorAll('div._aagu, div._aagu._aato');
    let bestImage = null;
    let bestArea = 0;
    
    for (const container of containers) {
      const img = container.querySelector('img');
      const result = updateBestImage(bestImage, bestArea, img);
      bestImage = result.best;
      bestArea = result.area;
    }
    
    return bestImage;
  }
  
  function isCarouselItemVisible(item) {
    const rect = item.getBoundingClientRect();
    const style = window.getComputedStyle(item);
    const transform = style.transform;
    return rect.width > 0 && rect.height > 0 &&
           style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           (transform === 'none' || !transform.includes('translateX(-') || transform.includes('translateX(0'));
  }
  
  function findInCarousel(element) {
    const carouselItems = element.querySelectorAll('li._acaz');
    let bestImage = null;
    let bestArea = 0;
    
    for (const item of carouselItems) {
      if (!isCarouselItemVisible(item)) continue;
      const img = item.querySelector('img');
      const result = updateBestImage(bestImage, bestArea, img);
      bestImage = result.best;
      bestArea = result.area;
    }
    
    return bestImage;
  }
  
  function findImageInTree(element) {
    if (!element) return null;
    
    let current = element;
    let bestImage = null;
    let bestArea = 0;
    
    while (current && current !== document.body) {
      if (current.tagName === 'IMG') {
        const result = updateBestImage(bestImage, bestArea, current);
        bestImage = result.best;
        bestArea = result.area;
      }
      
      const gridImage = findInGridContainers(current);
      if (gridImage) {
        const result = updateBestImage(bestImage, bestArea, gridImage);
        bestImage = result.best;
        bestArea = result.area;
      }
      
      const carouselImage = findInCarousel(current);
      if (carouselImage) {
        const result = updateBestImage(bestImage, bestArea, carouselImage);
        bestImage = result.best;
        bestArea = result.area;
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
