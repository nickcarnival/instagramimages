window.pageScriptLoaded = true;

const params = new URLSearchParams(window.location.search);
const rawImageUrl = params.get('imageUrl');
const imageUrl = rawImageUrl ? decodeURIComponent(rawImageUrl) : '';

const imageEl = document.getElementById('image');
const downloadBtn = document.getElementById('downloadBtn');
const cdnLink = document.getElementById('cdnLink');
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenImage = document.getElementById('fullscreenImage');
const closeFullscreenBtn = document.getElementById('closeFullscreen');

if (!imageUrl) {
  document.body.innerHTML = '<div class="error"><h1>No image URL provided</h1></div>';
} else {
  // Set CDN link - ensure it opens the actual image URL
  cdnLink.href = imageUrl;
  cdnLink.setAttribute('href', imageUrl);
  
  // Override click to ensure it opens the image URL
  cdnLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(imageUrl, '_blank');
  });
  
  // Try direct src first (usually works for Instagram CDN)
  imageEl.src = imageUrl;
  
  imageEl.onerror = () => {
    // Try loading via fetch/blob as fallback
    fetch(imageUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        imageEl.src = url;
      })
      .catch(() => {
        imageEl.alt = 'Failed to load image';
      });
  };
  
  imageEl.onload = () => {
    // Set fullscreen image src
    fullscreenImage.src = imageUrl;
  };
  
  // Fullscreen functionality
  function enterFullscreen() {
    fullscreenOverlay.classList.add('active');
    document.body.classList.add('fullscreen-active');
    document.body.style.overflow = 'hidden';
  }
  
  function exitFullscreen() {
    fullscreenOverlay.classList.remove('active');
    document.body.classList.remove('fullscreen-active');
    document.body.style.overflow = '';
  }
  
  // Hover to enter fullscreen
  let hoverTimeout;
  imageEl.addEventListener('mouseenter', () => {
    hoverTimeout = setTimeout(() => {
      enterFullscreen();
    }, 500);
  });
  
  imageEl.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimeout);
  });
  
  // Click to enter fullscreen
  imageEl.addEventListener('click', () => {
    clearTimeout(hoverTimeout);
    enterFullscreen();
  });
  
  // Close fullscreen
  closeFullscreenBtn.addEventListener('click', exitFullscreen);
  fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) {
      exitFullscreen();
    }
  });
  
  // ESC key to exit fullscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenOverlay.classList.contains('active')) {
      exitFullscreen();
    }
  });

  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    
    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0] || 'instagram-image.jpg';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Failed to download image: ${error.message}`);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '📥 Download';
    }
  });
}
