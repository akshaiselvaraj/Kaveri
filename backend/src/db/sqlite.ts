import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { generateAllData } from './generateSyntheticData';


const dbPath = path.resolve(__dirname, '../../kaveri.db');

// Ensure DB directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to local SQLite database at:', dbPath);
    initDatabase();
  }
});

// Helper for queries returning multiple rows
export function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// Helper for single row queries
export function queryGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

// Helper for insert/update/delete
export function runSql(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function initDatabase() {
  console.log('Initializing database tables...');
  
  db.serialize(() => {
    // Create Tables
    db.run(`
      CREATE TABLE IF NOT EXISTS location (
        location_id INTEGER PRIMARY KEY AUTOINCREMENT,
        district TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS fir (
        fir_id TEXT PRIMARY KEY,
        crime_type TEXT NOT NULL,
        date TEXT NOT NULL,
        location_id INTEGER,
        status TEXT CHECK(status IN ('Pending', 'Under Investigation', 'Completed', 'Closed')) DEFAULT 'Pending',
        description TEXT,
        FOREIGN KEY (location_id) REFERENCES location(location_id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS accused (
        accused_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        occupation TEXT,
        risk_score INTEGER CHECK(risk_score BETWEEN 0 AND 100) DEFAULT 0
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS victim (
        victim_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        occupation TEXT
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS transaction_table (
        transaction_id TEXT PRIMARY KEY,
        from_account TEXT NOT NULL,
        to_account TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS crime_link (
        fir_id TEXT NOT NULL,
        accused_id INTEGER,
        victim_id INTEGER,
        PRIMARY KEY (fir_id, accused_id, victim_id),
        FOREIGN KEY (fir_id) REFERENCES fir(fir_id),
        FOREIGN KEY (accused_id) REFERENCES accused(accused_id),
        FOREIGN KEY (victim_id) REFERENCES victim(victim_id)
      );
    `);

    // Check if data already exists, if so skip seeding
    db.get('SELECT COUNT(*) as count FROM location', async (err, row: any) => {
      if (err) {
        console.error('Error checking location count:', err);
        return;
      }
      if (row && row.count > 0) {
        console.log('Database already populated. Skipping seeding.');
        return;
      }

      console.log('Generating synthetic dataset and seeding SQLite...');
      const data = generateAllData();

      // Seed Locations
      const stmtLoc = db.prepare('INSERT INTO location (location_id, district, latitude, longitude) VALUES (?, ?, ?, ?)');
      db.serialize(() => {
        data.locations.forEach(loc => stmtLoc.run(loc.location_id, loc.district, loc.latitude, loc.longitude));
        stmtLoc.finalize();
      });

      // Seed Accused
      const stmtAcc = db.prepare('INSERT INTO accused (accused_id, name, age, gender, occupation, risk_score) VALUES (?, ?, ?, ?, ?, ?)');
      db.serialize(() => {
        data.accused.forEach(acc => stmtAcc.run(acc.accused_id, acc.name, acc.age, acc.gender, acc.occupation, acc.risk_score));
        stmtAcc.finalize();
      });

      // Seed Victims
      const stmtVic = db.prepare('INSERT INTO victim (victim_id, name, age, gender, occupation) VALUES (?, ?, ?, ?, ?)');
      db.serialize(() => {
        data.victims.forEach(v => stmtVic.run(v.victim_id, v.name, v.age, v.gender, v.occupation));
        stmtVic.finalize();
      });

      // Seed FIRs
      const stmtFir = db.prepare('INSERT INTO fir (fir_id, crime_type, date, location_id, status, description) VALUES (?, ?, ?, ?, ?, ?)');
      db.serialize(() => {
        data.firs.forEach(f => stmtFir.run(f.fir_id, f.crime_type, f.date, f.location_id, f.status, f.description));
        stmtFir.finalize();
      });

      // Seed Transactions
      const stmtTxn = db.prepare('INSERT INTO transaction_table (transaction_id, from_account, to_account, amount, date) VALUES (?, ?, ?, ?, ?)');
      db.serialize(() => {
        data.txns.forEach(t => stmtTxn.run(t.transaction_id, t.from_account, t.to_account, t.amount, t.date));
        stmtTxn.finalize();
      });

      // Seed Crime Links
      const stmtLink = db.prepare('INSERT INTO crime_link (fir_id, accused_id, victim_id) VALUES (?, ?, ?)');
      db.serialize(() => {
        data.links.forEach(l => stmtLink.run(l.fir_id, l.accused_id, l.victim_id));
        stmtLink.finalize();
      });

      console.log('SQLite Database seeded successfully with 500 FIRs, 300 Accused, 300 Victims, 1000 Transactions.');
    });
  });
}
