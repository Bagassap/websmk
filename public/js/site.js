(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.sub-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const li = b.parentElement;
      const open = !li.classList.contains('open');
      document.querySelectorAll('.has-sub.open').forEach((x) => {
        x.classList.remove('open');
        x.querySelector('.sub-btn').setAttribute('aria-expanded', 'false');
      });
      li.classList.toggle('open', open);
      b.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.has-sub')) return;
    document.querySelectorAll('.has-sub.open').forEach((x) => {
      x.classList.remove('open');
      x.querySelector('.sub-btn').setAttribute('aria-expanded', 'false');
    });
  });
  const hide = (img) => img.classList.add('img-missing');
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') hide(e.target); }, true);
  document.querySelectorAll('img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) hide(img); });
})();
