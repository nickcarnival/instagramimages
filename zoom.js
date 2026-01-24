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
const zoomControls = document.querySelector('.zoom-controls');
const zoomFitBtn = document.getElementById('zoomFit');
const zoom100Btn = document.getElementById('zoom100');
const zoom200Btn = document.getElementById('zoom200');
const zoom400Btn = document.getElementById('zoom400');

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


let mousePosition = {
  x: 0,
  y: 0
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
      
      const initialScale = 1.5;
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
  
  function setZoomFromPercent(percent, mouseX = null, mouseY = null) {
    const newScale = Math.max(0.1, Math.min(10, percent / 100));
    const rect = zoomContainer.getBoundingClientRect();
    
    if (mouseX === null || mouseY === null) {
      mouseX = mousePosition.x - rect.left;
      mouseY = mousePosition.y - rect.top;
    }
    
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    
    const mouseXRelativeToCenter = mouseX - containerCenterX;
    const mouseYRelativeToCenter = mouseY - containerCenterY;
    
    const scaleChange = newScale / zoomState.scale;
    zoomState.x = mouseXRelativeToCenter - (mouseXRelativeToCenter - zoomState.x) * scaleChange;
    zoomState.y = mouseYRelativeToCenter - (mouseYRelativeToCenter - zoomState.y) * scaleChange;
    zoomState.scale = newScale;
    
    updateZoomTransform();
  }
  
  function resetZoom() {
    zoomState.scale = 0.5;
    zoomState.x = 0;
    zoomState.y = 0;
    updateZoomTransform();
  }
  
  function fitToScreen() {
    const rect = zoomContainer.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    const naturalWidth = zoomImage.naturalWidth;
    const naturalHeight = zoomImage.naturalHeight;
    const aspectRatio = naturalWidth / naturalHeight;
    
    let fitScale;
    if (containerWidth / containerHeight > aspectRatio) {
      fitScale = containerHeight / naturalHeight;
    } else {
      fitScale = containerWidth / naturalWidth;
    }
    
    zoomState.scale = fitScale;
    zoomState.x = 0;
    zoomState.y = 0;
    updateZoomTransform();
  }
  
  initializeZoomAtClick();
  
  function zoomIn() {
    const newPercent = Math.min(Math.round(zoomState.scale * 100) + 25, 1000);
    setZoomFromPercent(newPercent);
  }
  
  function zoomOut() {
    const newPercent = Math.max(Math.round(zoomState.scale * 100) - 25, 10);
    setZoomFromPercent(newPercent);
  }
  
  zoomInput.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setZoomFromPercent(value);
    }
  });
  
  zoomInput.addEventListener('blur', (e) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 10) {
      e.target.value = 10;
      setZoomFromPercent(10);
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
    if (e.target.closest('.zoom-controls')) return;
    zoomState.isDragging = true;
    zoomState.startX = e.clientX;
    zoomState.startY = e.clientY;
    zoomState.startTranslateX = zoomState.x;
    zoomState.startTranslateY = zoomState.y;
    zoomContainer.classList.add('dragging');
    e.preventDefault();
  });
  
  zoomContainer.addEventListener('dblclick', (e) => {
    if (e.target.closest('.zoom-controls')) return;
    resetZoom();
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
    
    if (zoomState.isDragging) {
      const deltaX = e.clientX - zoomState.startX;
      const deltaY = e.clientY - zoomState.startY;
      zoomState.x = zoomState.startTranslateX + deltaX;
      zoomState.y = zoomState.startTranslateY + deltaY;
      updateZoomTransform();
    }
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
    const newScale = Math.max(0.1, Math.min(10, zoomState.scale * delta));
    
    const rect = zoomContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newPercent = Math.round(newScale * 100);
    setZoomFromPercent(newPercent, mouseX, mouseY);
  });
  
  updateZoomInput();
  
  zoomResetBtn.addEventListener('click', resetZoom);
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  zoomFitBtn.addEventListener('click', fitToScreen);
  zoom100Btn.addEventListener('click', () => setZoomFromPercent(100));
  zoom200Btn.addEventListener('click', () => setZoomFromPercent(200));
  zoom400Btn.addEventListener('click', () => setZoomFromPercent(400));
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
