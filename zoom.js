const params = new URLSearchParams(window.location.search);
const rawImageUrl = params.get('imageUrl');
const imageUrl = rawImageUrl ? decodeURIComponent(rawImageUrl) : '';
const clickPercentX = parseFloat(params.get('clickX')) || null;
const clickPercentY = parseFloat(params.get('clickY')) || null;

const zoomImage = document.getElementById('zoomImage');
const zoomContainer = document.querySelector('.zoom-container');
const zoomResetBtn = document.getElementById('zoomReset');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const closeZoomBtn = document.getElementById('closeZoom');
const zoomInput = document.getElementById('zoomInput');

let zoomState = {
  scale: 1,
  x: 0,
  y: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  startTranslateX: 0,
  startTranslateY: 0
};

if (!imageUrl) {
  document.body.innerHTML = '<div style="color: #ff6b6b; text-align: center; padding: 50px;"><h1>No image URL provided</h1></div>';
} else {
  zoomImage.src = imageUrl;
  
  zoomImage.onerror = () => {
    fetch(imageUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        zoomImage.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        zoomImage.alt = 'Failed to load image';
      });
  };
  
  function initializeZoomAtClick() {
    if (clickPercentX !== null && clickPercentY !== null && zoomImage.complete) {
      applyInitialZoom();
    } else if (clickPercentX !== null && clickPercentY !== null) {
      zoomImage.addEventListener('load', applyInitialZoom, { once: true });
    }
  }
  
  function applyInitialZoom() {
    setTimeout(() => {
      const containerRect = zoomContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      const initialScale = 2.5;
      zoomState.scale = initialScale;
      
      const naturalWidth = zoomImage.naturalWidth;
      const naturalHeight = zoomImage.naturalHeight;
      const aspectRatio = naturalWidth / naturalHeight;
      
      let displayedWidth = containerWidth;
      let displayedHeight = containerHeight;
      
      if (containerWidth / containerHeight > aspectRatio) {
        displayedWidth = containerHeight * aspectRatio;
      } else {
        displayedHeight = containerWidth / aspectRatio;
      }
      
      const clickXInImage = (clickPercentX / 100) * displayedWidth;
      const clickYInImage = (clickPercentY / 100) * displayedHeight;
      
      const imageCenterX = displayedWidth / 2;
      const imageCenterY = displayedHeight / 2;
      
      const offsetFromCenterX = clickXInImage - imageCenterX;
      const offsetFromCenterY = clickYInImage - imageCenterY;
      
      zoomState.x = -offsetFromCenterX * initialScale;
      zoomState.y = -offsetFromCenterY * initialScale;
      
      updateZoomTransform();
    }, 50);
  }
  
  function updateZoomTransform() {
    const transform = `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;
    zoomImage.style.transform = `translate(-50%, -50%) ${transform}`;
    updateZoomInput();
  }
  
  function updateZoomInput() {
    const zoomPercent = Math.round(zoomState.scale * 100);
    zoomInput.value = zoomPercent;
  }
  
  function setZoomFromPercent(percent, centerX = null, centerY = null) {
    const newScale = Math.max(0.5, Math.min(10, percent / 100));
    
    if (centerX !== null && centerY !== null) {
      const rect = zoomContainer.getBoundingClientRect();
      const mouseX = centerX - rect.left;
      const mouseY = centerY - rect.top;
      
      const scaleChange = newScale / zoomState.scale;
      zoomState.x = mouseX - (mouseX - zoomState.x) * scaleChange;
      zoomState.y = mouseY - (mouseY - zoomState.y) * scaleChange;
    }
    
    zoomState.scale = newScale;
    updateZoomTransform();
  }
  
  function resetZoom() {
    zoomState.scale = 1;
    zoomState.x = 0;
    zoomState.y = 0;
    updateZoomTransform();
  }
  
  initializeZoomAtClick();
  
  function zoomIn() {
    const rect = zoomContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const newPercent = Math.min(Math.round(zoomState.scale * 100) + 25, 1000);
    setZoomFromPercent(newPercent, centerX, centerY);
  }
  
  function zoomOut() {
    const rect = zoomContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const newPercent = Math.max(Math.round(zoomState.scale * 100) - 25, 50);
    setZoomFromPercent(newPercent, centerX, centerY);
  }
  
  zoomInput.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setZoomFromPercent(value);
    }
  });
  
  zoomInput.addEventListener('blur', (e) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 50) {
      e.target.value = 50;
      setZoomFromPercent(50);
    } else if (value > 1000) {
      e.target.value = 1000;
      setZoomFromPercent(1000);
    }
  });
  
  function goBack() {
    const baseUrl = chrome.runtime.getURL(`page.html?imageUrl=${encodeURIComponent(imageUrl)}`);
    window.location.href = baseUrl;
  }
  
  zoomContainer.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    zoomState.isDragging = true;
    zoomState.startX = e.clientX;
    zoomState.startY = e.clientY;
    zoomState.startTranslateX = zoomState.x;
    zoomState.startTranslateY = zoomState.y;
    zoomContainer.classList.add('dragging');
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!zoomState.isDragging) return;
    const deltaX = e.clientX - zoomState.startX;
    const deltaY = e.clientY - zoomState.startY;
    zoomState.x = zoomState.startTranslateX + deltaX;
    zoomState.y = zoomState.startTranslateY + deltaY;
    updateZoomTransform();
  });
  
  document.addEventListener('mouseup', () => {
    if (zoomState.isDragging) {
      zoomState.isDragging = false;
      zoomContainer.classList.remove('dragging');
    }
  });
  
  zoomContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(10, zoomState.scale * delta));
    
    const rect = zoomContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleChange = newScale / zoomState.scale;
    zoomState.x = mouseX - (mouseX - zoomState.x) * scaleChange;
    zoomState.y = mouseY - (mouseY - zoomState.y) * scaleChange;
    zoomState.scale = newScale;
    
    updateZoomTransform();
  });
  
  updateZoomInput();
  
  zoomResetBtn.addEventListener('click', resetZoom);
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  closeZoomBtn.addEventListener('click', goBack);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      goBack();
    } else if (e.key === '+' || e.key === '=') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  });
}
