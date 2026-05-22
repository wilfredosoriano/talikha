import * as SQLite from 'expo-sqlite';

export type Category = 'Task' | 'Idea' | 'Note' | 'Reference';

export interface Capture {
  id: string;
  transcript: string;
  title: string;
  category: Category;
  summary: string;
  tags: string[];
  createdAt: string;
  completed: boolean;
}

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS captures (
      id TEXT PRIMARY KEY,
      transcript TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      tags TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );
  `);
  // migrate existing DBs that don't have the completed column yet
  await db.execAsync(
    `ALTER TABLE captures ADD COLUMN completed INTEGER NOT NULL DEFAULT 0;`
  ).catch(() => {});
}

export async function insertCapture(db: SQLite.SQLiteDatabase, capture: Capture): Promise<void> {
  await db.runAsync(
    `INSERT INTO captures (id, transcript, title, category, summary, tags, createdAt, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      capture.id,
      capture.transcript,
      capture.title,
      capture.category,
      capture.summary,
      JSON.stringify(capture.tags),
      capture.createdAt,
      capture.completed ? 1 : 0,
    ]
  );
}

export async function getAllCaptures(db: SQLite.SQLiteDatabase): Promise<Capture[]> {
  const rows = await db.getAllAsync<{
    id: string;
    transcript: string;
    title: string;
    category: string;
    summary: string;
    tags: string;
    createdAt: string;
  }>('SELECT * FROM captures ORDER BY createdAt DESC');

  return rows.map((row) => ({
    ...row,
    category: row.category as Category,
    completed: Boolean((row as any).completed),
    tags: (() => {
      try {
        return JSON.parse(row.tags);
      } catch {
        return [];
      }
    })(),
  }));
}

export async function updateCaptureFields(
  db: SQLite.SQLiteDatabase,
  id: string,
  fields: { title?: string; summary?: string }
): Promise<void> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  await db.runAsync(`UPDATE captures SET ${sets} WHERE id = ?`, [...values, id]);
}

export async function updateCaptureCategory(
  db: SQLite.SQLiteDatabase,
  id: string,
  category: Category
): Promise<void> {
  await db.runAsync('UPDATE captures SET category = ? WHERE id = ?', [category, id]);
}

export async function markCaptureComplete(
  db: SQLite.SQLiteDatabase,
  id: string,
  completed: boolean
): Promise<void> {
  await db.runAsync('UPDATE captures SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
}

export async function deleteCapture(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM captures WHERE id = ?', [id]);
}
