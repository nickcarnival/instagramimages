document.addEventListener('contextmenu', (e) => {
  document.documentElement.dataset.lastContextX = String(e.clientX);
  document.documentElement.dataset.lastContextY = String(e.clientY);
}, true);
