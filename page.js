window.pageScriptLoaded = true;
console.log('=== PAGE SCRIPT STARTING ===');
console.log('Full URL:', window.location.href);

const params = new URLSearchParams(window.location.search);
console.log('Raw URL params:', window.location.search);
console.log('All params:', Object.fromEntries(params));

const rawImageUrl = params.get('imageUrl');
console.log('Raw imageUrl param:', rawImageUrl);
console.log('Type of rawImageUrl:', typeof rawImageUrl);

const imageUrl = rawImageUrl ? decodeURIComponent(rawImageUrl) : '';
console.log('=== DECODED IMAGE URL ===');
console.log(imageUrl);
console.log('URL length:', imageUrl.length);
console.log('URL starts with http:', imageUrl.startsWith('http'));

const imageEl = document.getElementById('image');
const downloadBtn = document.getElementById('downloadBtn');
const cdnLink = document.getElementById('cdnLink');
const urlText = document.getElementById('urlText');

if (!imageUrl) {
  console.error('=== ERROR: NO IMAGE URL ===');
  console.error('Raw param was:', rawImageUrl);
  urlText.textContent = 'ERROR: No image URL provided';
  urlText.style.color = '#ff6b6b';
  document.body.innerHTML = '<div class="error"><h1>No image URL provided</h1><p>Check console for details</p></div>';
} else {
  // Display URL on page
  urlText.textContent = imageUrl;
  urlText.style.color = '#4a9eff';
  console.log('=== SETTING UP IMAGE ===');
  console.log('Image element found:', !!imageEl);
  console.log('Download button found:', !!downloadBtn);
  console.log('CDN link found:', !!cdnLink);
  
  // Set CDN link - ensure it opens the actual image URL
  cdnLink.href = imageUrl;
  cdnLink.setAttribute('href', imageUrl);
  console.log('CDN link href set to:', cdnLink.href);
  console.log('CDN link getAttribute href:', cdnLink.getAttribute('href'));
  
  // Override click to ensure it opens the image URL
  cdnLink.addEventListener('click', (e) => {
    console.log('CDN link clicked, opening:', imageUrl);
    e.preventDefault();
    window.open(imageUrl, '_blank');
  });
  
  // Try direct src first (usually works for Instagram CDN)
  console.log('=== ATTEMPTING TO LOAD IMAGE ===');
  console.log('Setting image src to:', imageUrl);
  imageEl.src = imageUrl;
  
  imageEl.onerror = (e) => {
    console.error('=== IMAGE ERROR EVENT ===');
    console.error('Error event:', e);
    console.error('Failed URL:', imageUrl);
    console.error('Image element src:', imageEl.src);
    // Try loading via fetch/blob as fallback
    console.log('Attempting fetch fallback...');
    fetch(imageUrl)
      .then(response => {
        console.log('Fetch response status:', response.status);
        console.log('Fetch response ok:', response.ok);
        console.log('Fetch response headers:', [...response.headers.entries()]);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        console.log('Blob created successfully');
        console.log('Blob size:', blob.size, 'bytes');
        console.log('Blob type:', blob.type);
        const url = URL.createObjectURL(blob);
        console.log('Object URL created:', url);
        imageEl.src = url;
      })
      .catch(err => {
        console.error('=== ALL IMAGE LOADING METHODS FAILED ===');
        console.error('Error:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        imageEl.alt = 'Failed to load image';
        urlText.textContent = `ERROR: ${err.message}`;
        urlText.style.color = '#ff6b6b';
      });
  };
  
  imageEl.onload = () => {
    console.log('=== IMAGE LOADED SUCCESSFULLY ===');
    console.log('Image dimensions:', imageEl.naturalWidth, 'x', imageEl.naturalHeight);
    console.log('Image complete:', imageEl.complete);
    console.log('Image src:', imageEl.src);
  };

  downloadBtn.addEventListener('click', async () => {
    console.log('=== DOWNLOAD BUTTON CLICKED ===');
    console.log('Image URL:', imageUrl);
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    
    try {
      console.log('Fetching image for download...');
      console.log('Fetch URL:', imageUrl);
      const response = await fetch(imageUrl);
      console.log('Download fetch response status:', response.status);
      console.log('Download fetch response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Download blob created');
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      console.log('Object URL for download:', url);
      
      const link = document.createElement('a');
      link.href = url;
      
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0] || 'instagram-image.jpg';
      link.download = filename;
      console.log('Download filename:', filename);
      
      console.log('Triggering download...');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('=== DOWNLOAD TRIGGERED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== DOWNLOAD ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Failed to download image: ${error.message}`);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '📥 Download';
    }
  });
  
  console.log('=== PAGE SETUP COMPLETE ===');
  console.log('Image URL:', imageUrl);
  console.log('CDN Link href:', cdnLink.href);
}
