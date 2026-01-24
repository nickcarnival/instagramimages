const params = new URLSearchParams(window.location.search);
const rawImageUrl = params.get('imageUrl');
const imageUrl = rawImageUrl ? decodeURIComponent(rawImageUrl) : '';

const imageEl = document.getElementById('image');
const downloadBtn = document.getElementById('downloadBtn');
const cdnLink = document.getElementById('cdnLink');

if (!imageUrl) {
  document.body.innerHTML = '<div class="error"><h1>No image URL provided</h1></div>';
} else {
  cdnLink.href = imageUrl;
  cdnLink.removeAttribute('target');
  
  cdnLink.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
    return false;
  });
  
  imageEl.src = imageUrl;
  
  imageEl.onerror = () => {
    fetch(imageUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        imageEl.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        imageEl.alt = 'Failed to load image';
      });
  };
  
  function enterZoomView(e) {
    const rect = imageEl.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const clickPercentX = (clickX / rect.width) * 100;
    const clickPercentY = (clickY / rect.height) * 100;
    
    const zoomUrl = chrome.runtime.getURL(`zoom.html?imageUrl=${encodeURIComponent(imageUrl)}&clickX=${clickPercentX}&clickY=${clickPercentY}`);
    window.location.href = zoomUrl;
  }
  
  imageEl.addEventListener('click', enterZoomView);

  downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    
    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0] || 'instagram-image.jpg';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Failed to download image: ${error.message}`);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '📥 Download';
    }
  });
}
