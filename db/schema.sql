CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Salinan utuh setiap entri WordPress. Tabel ini tidak diubah oleh panel admin.
CREATE TABLE IF NOT EXISTS wp_archive (
  wp_id BIGINT PRIMARY KEY,
  post_type TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  raw_content TEXT NOT NULL DEFAULT '',
  raw_sha256 TEXT NOT NULL,
  data JSONB NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terms (
  id SERIAL PRIMARY KEY,
  taxonomy TEXT NOT NULL CHECK (taxonomy IN ('category', 'tag')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (taxonomy, slug)
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  wp_id BIGINT UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  alt TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL DEFAULT '',
  in_gallery BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contents (
  id SERIAL PRIMARY KEY,
  wp_id BIGINT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('post', 'page')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('publish', 'draft', 'trash')),
  featured_media_id INT REFERENCES media(id) ON DELETE SET NULL,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  redirect_url TEXT,
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, slug)
);
CREATE INDEX IF NOT EXISTS contents_list_idx ON contents (type, status, published_at DESC);

CREATE TABLE IF NOT EXISTS content_terms (
  content_id INT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  term_id INT NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, term_id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  wp_id BIGINT UNIQUE,
  parent_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  UNIQUE (name, role)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
