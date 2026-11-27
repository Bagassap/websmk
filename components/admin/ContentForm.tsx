'use client';

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { saveContent, uploadImage, type FormState } from '@/app/admin/actions';
import { UPLOAD_ERRORS } from '@/lib/flash';

export type ContentFormItem = {
  id: number | null; title: string; slug: string; excerpt: string; content_html: string; status: string;
  published_at: string; featured_media_id: number | null; image: string | null; seo_title: string; seo_description: string;
};

type Props = {
  kind: string;
  isPost: boolean;
  item: ContentFormItem;
  categories: { id: number; name: string }[];
  selected: number[];
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const STATUSES = [['publish', 'Tayang'], ['draft', 'Draf'], ['trash', 'Sampah']];

async function upload(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await uploadImage(fd);
  if ('error' in r) throw new Error(UPLOAD_ERRORS[r.error]);
  return r;
}

export default function ContentForm({ kind, isPost, item, categories, selected }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveContent.bind(null, kind, item.id), null);
  const editor = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLTextAreaElement>(null);
  const inlineImage = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [featured, setFeatured] = useState({ id: item.featured_media_id, url: item.image ? `/uploads/${item.image}` : '' });

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = item.content_html;
  }, [item.content_html]);

  const sync = () => { if (editor.current && source.current) source.current.value = editor.current.innerHTML; };
  const remember = () => {
    const s = window.getSelection();
    if (s?.rangeCount && editor.current?.contains(s.anchorNode)) savedRange.current = s.getRangeAt(0).cloneRange();
  };
  const restore = () => {
    editor.current?.focus();
    const s = window.getSelection();
    if (savedRange.current && s) { s.removeAllRanges(); s.addRange(savedRange.current); }
  };
  const exec = (cmd: string, value?: string) => {
    if (showSource) return;
    restore();
    document.execCommand(cmd, false, value);
    remember();
    sync();
  };

  const toggleSource = () => {
    if (!editor.current || !source.current) return;
    if (showSource) editor.current.innerHTML = source.current.value;
    else sync();
    setShowSource(!showSource);
  };

  const addLink = () => {
    const url = window.prompt('Alamat link (https://...)');
    if (url && /^(https?:|mailto:|tel:|\/)/i.test(url)) exec('createLink', url);
  };

  const onInlineImage = async () => {
    const file = inlineImage.current?.files?.[0];
    if (!file) return;
    try {
      const { url } = await upload(file);
      exec('insertImage', url);
    } catch (err) { window.alert((err as Error).message); }
    if (inlineImage.current) inlineImage.current.value = '';
  };

  const onFeatured = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      setFeatured(await upload(file));
    } catch (err) { window.alert((err as Error).message); }
  };

  // Dikirim manual agar isi formulir tidak dikosongkan React ketika ada pesan kesalahan.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!showSource) sync();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };

  return (
    <>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <form onSubmit={onSubmit} className="editor-form">
        <div className="panel">
          <label>Judul<input name="title" defaultValue={item.title} required maxLength={300} /></label>
          <label>Alamat (slug)<input name="slug" defaultValue={item.slug} placeholder="otomatis dari judul" /></label>
          <div className="field">
            <span className="label">Isi</span>
            <div className="toolbar" role="toolbar" aria-label="Format teks" onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault(); }}>
              <button type="button" onClick={() => exec('bold')}><b>B</b></button>
              <button type="button" onClick={() => exec('italic')}><i>I</i></button>
              <button type="button" onClick={() => exec('formatBlock', 'h2')}>H2</button>
              <button type="button" onClick={() => exec('formatBlock', 'h3')}>H3</button>
              <button type="button" onClick={() => exec('formatBlock', 'p')}>Teks</button>
              <button type="button" onClick={() => exec('insertUnorderedList')}>Daftar</button>
              <button type="button" onClick={() => exec('insertOrderedList')}>Nomor</button>
              <button type="button" onClick={() => exec('formatBlock', 'blockquote')}>Kutipan</button>
              <button type="button" onClick={addLink}>Link</button>
              <button type="button" onClick={() => { if (!showSource) { remember(); inlineImage.current?.click(); } }}>Gambar</button>
              <button type="button" onClick={toggleSource} className={showSource ? 'on' : ''}>HTML</button>
            </div>
            <div
              ref={editor} className="editor prose" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Isi"
              hidden={showSource} onInput={sync} onKeyUp={remember} onMouseUp={remember}
            />
            <textarea ref={source} name="content_html" className="source" hidden={!showSource} aria-label="Kode HTML" defaultValue={item.content_html} />
            <input ref={inlineImage} type="file" accept={ACCEPT} hidden onChange={onInlineImage} />
          </div>
          <label>Ringkasan<textarea name="excerpt" rows={3} defaultValue={item.excerpt} /></label>
        </div>
        <div className="panel side-panel">
          <label>Status
            <select name="status" defaultValue={item.status}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>Tanggal terbit (WIB)<input type="datetime-local" name="published_at" defaultValue={item.published_at} /></label>
          <div className="field">
            <span className="label">Gambar utama</span>
            <input type="hidden" name="featured_media_id" value={featured.id ?? ''} />
            {featured.url && <img className="preview" src={featured.url} alt="" />}
            <input type="file" accept={ACCEPT} aria-label="Unggah gambar utama" onChange={(e) => onFeatured(e.currentTarget)} />
          </div>
          {isPost && (
            <fieldset><legend>Kategori</legend>
              {categories.map((c) => (
                <label className="check" key={c.id}><input type="checkbox" name="categories" value={c.id} defaultChecked={selected.includes(c.id)} /> {c.name}</label>
              ))}
            </fieldset>
          )}
          <label>Judul SEO<input name="seo_title" defaultValue={item.seo_title} /></label>
          <label>Deskripsi SEO<textarea name="seo_description" rows={3} defaultValue={item.seo_description} /></label>
          <button className="btn" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </form>
    </>
  );
}
