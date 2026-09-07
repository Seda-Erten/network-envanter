import Database from "better-sqlite3";
import path from "path";

// Veritabanı dosyası proje kök dizininde "envanter.db" olarak saklanır.
// Not: Bu tamamen yerel/demo bir veritabanıdır, gerçek şirket ağına
// veya sistemlerine hiçbir şekilde bağlanmaz.
const dbPath = path.join(process.cwd(), "envanter.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// --- Tablo tanımları -------------------------------------------------

// users: sistemi kullanan şirketler/kullanıcılar (SaaS için)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN supabase_id TEXT");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS racks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    size_u INTEGER NOT NULL DEFAULT 42,
    location TEXT,
    pos_x INTEGER DEFAULT 0,
    pos_y INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

try {
  db.exec("ALTER TABLE racks ADD COLUMN pos_x INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE racks ADD COLUMN pos_y INTEGER DEFAULT 0");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    ip_address TEXT,
    mac_address TEXT,
    brand TEXT,
    rack_id INTEGER,
    rack_u INTEGER,
    user_id INTEGER,
    pos_x INTEGER DEFAULT 0,
    pos_y INTEGER DEFAULT 0,
    port_count INTEGER DEFAULT 24,
    size_u INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'aktif',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (rack_id) REFERENCES racks (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

try {
  db.exec("ALTER TABLE devices ADD COLUMN pos_x INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN pos_y INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE racks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN rack_u INTEGER");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN rack_id INTEGER REFERENCES racks(id) ON DELETE SET NULL");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN ip_address TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN mac_address TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN brand TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN port_count INTEGER DEFAULT 24");
} catch (e) {}

try {
  db.exec("ALTER TABLE devices ADD COLUMN size_u INTEGER DEFAULT 1");
} catch (e) {}

// connections: iki cihaz arasındaki kablo/port bağlantısı
// device_a -> device_b yönü sadece kayıt kolaylığı içindir, anlamsal
// bir yön ifade etmez (örn. switch <-> pc).
db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    device_a_id INTEGER NOT NULL,
    port_a TEXT NOT NULL,
    device_b_id INTEGER NOT NULL,
    port_b TEXT NOT NULL,
    cable_type TEXT NOT NULL DEFAULT 'Cat6',
    speed TEXT,
    status TEXT NOT NULL DEFAULT 'aktif',
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (device_a_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY (device_b_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

try {
  db.exec("ALTER TABLE connections ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE");
} catch (e) {}

try {
  db.exec("ALTER TABLE connections ADD COLUMN speed TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE connections ADD COLUMN color TEXT");
} catch (e) {}

// port_labels: Patch Panel portlarına etiket (hangi odadan geliyor)
db.exec(`
  CREATE TABLE IF NOT EXISTS port_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    port_number INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    user_id INTEGER,
    FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(device_id, port_number)
  )
`);

export default db;
