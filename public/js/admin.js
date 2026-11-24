(() => {
  const csrf = document.querySelector('meta[name=csrf]')?.content;

  async function uploadImage(file) {
    const data = new FormData();
    data.append('file', file);
    const r = await fetch('/admin/media/upload', { method: 'POST', body: data, headers: { 'X-CSRF-Token': csrf, Accept: 'application/json' } });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json.error || 'Gagal mengunggah gambar.');
    return json;
  }

  document.querySelectorAll('form[data-confirm]').forEach((f) => {
    f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirm)) e.preventDefault(); });
  });

  document.querySelectorAll('[data-photo]').forEach((input) => {
    input.addEventListener('change', async () => {
      if (!input.files[0]) return;
      const form = input.closest('form');
      try {
        const { url } = await uploadImage(input.files[0]);
        form.querySelector('[name=photo]').value = url;
        form.requestSubmit();
      } catch (err) { alert(err.message); }
    });
  });

  const form = document.getElementById('content-form');
  if (!form) return;
  const editor = document.getElementById('editor');
  const source = document.getElementById('content_html');
  const inlineImage = document.getElementById('inline-image');
  let showingSource = false;
  let savedRange = null;
  editor.innerHTML = source.value;

  const remember = () => {
    const s = getSelection();
    if (s.rangeCount && editor.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    editor.focus();
    if (savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); }
  };
  editor.addEventListener('keyup', remember);
  editor.addEventListener('mouseup', remember);

  document.querySelector('.toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.action === 'source') {
      showingSource = !showingSource;
      if (showingSource) source.value = editor.innerHTML; else editor.innerHTML = source.value;
      source.hidden = !showingSource;
      editor.hidden = showingSource;
      b.classList.toggle('on', showingSource);
      return;
    }
    if (showingSource) return;
    if (b.dataset.action === 'image') { remember(); inlineImage.click(); return; }
    restore();
    if (b.dataset.cmd) document.execCommand(b.dataset.cmd);
    if (b.dataset.block) document.execCommand('formatBlock', false, b.dataset.block);
    if (b.dataset.action === 'link') {
      const url = prompt('Alamat link (https://...)');
      if (url && /^(https?:|mailto:|tel:|\/)/i.test(url)) document.execCommand('createLink', false, url);
    }
    remember();
  });

  inlineImage.addEventListener('change', async () => {
    if (!inlineImage.files[0]) return;
    try {
      const { url } = await uploadImage(inlineImage.files[0]);
      restore();
      document.execCommand('insertImage', false, url);
    } catch (err) { alert(err.message); }
    inlineImage.value = '';
  });

  const featured = document.getElementById('featured_file');
  featured.addEventListener('change', async () => {
    if (!featured.files[0]) return;
    try {
      const { id, url } = await uploadImage(featured.files[0]);
      document.getElementById('featured_id').value = id;
      const p = document.getElementById('featured_preview');
      p.src = url;
      p.hidden = false;
    } catch (err) { alert(err.message); }
  });

  form.addEventListener('submit', () => {
    if (!showingSource) source.value = editor.innerHTML;
    source.hidden = true;
    const d = form.querySelector('[data-wib]');
    if (d?.value && !d.value.endsWith('+07:00')) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'published_at';
      hidden.value = `${d.value}:00+07:00`;
      d.removeAttribute('name');
      form.appendChild(hidden);
    }
  });
})();
