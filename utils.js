function handleImageError(imageElement, imageUrl) {
  imageElement.onerror = () => {
    fetch(imageUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        imageElement.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        imageElement.alt = 'Failed to load image';
      });
  };
}

function showError(message) {
  document.body.innerHTML = `<div style="color: #ff6b6b; text-align: center; padding: 50px;"><h1>${message}</h1></div>`;
}

function calculateAspectRatio(naturalWidth, naturalHeight) {
  return naturalWidth / naturalHeight;
}

function calculateImageDimensions(containerWidth, containerHeight, aspectRatio) {
  let displayedWidth = containerWidth;
  let displayedHeight = containerHeight;
  
  if (containerWidth / containerHeight > aspectRatio) {
    displayedWidth = containerHeight * aspectRatio;
  } else {
    displayedHeight = containerWidth / aspectRatio;
  }
  
  return { displayedWidth, displayedHeight };
}

function calculateFitScale(containerWidth, containerHeight, naturalWidth, naturalHeight) {
  const aspectRatio = calculateAspectRatio(naturalWidth, naturalHeight);
  
  if (containerWidth / containerHeight > aspectRatio) {
    return containerHeight / naturalHeight;
  } else {
    return containerWidth / naturalWidth;
  }
}
