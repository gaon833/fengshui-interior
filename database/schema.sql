CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  visitor_id TEXT,
  project_slug TEXT,
  gallery_id TEXT,
  image_id TEXT,
  search_query TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON analytics_events(created_at);
CREATE TABLE IF NOT EXISTS gallery_ai_analysis (
  gallery_id TEXT PRIMARY KEY,
  description TEXT,
  space_type TEXT,
  styles TEXT,
  colors TEXT,
  materials TEXT,
  lighting TEXT,
  keywords TEXT,
  raw_result TEXT,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS project_stats (
  project_slug TEXT PRIMARY KEY,
  views INTEGER DEFAULT 0,
  scraps INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gallery_stats (
  gallery_id TEXT PRIMARY KEY,
  views INTEGER DEFAULT 0,
  scraps INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS popular_searches (
  keyword TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
