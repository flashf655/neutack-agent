import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { encrypt, decrypt } from './crypto';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;

export async function getDb() {
    if (db) return db;

    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    db = await open({
        filename: path.join(dataDir, 'neutack.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            encrypted_content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            encrypted_title TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            encrypted_value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            tokens INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    return db;
}

// Conversation Helpers
export async function addMessage(role: 'user' | 'agent', content: string) {
    const database = await getDb();
    const encrypted = encrypt(content);
    await database.run(
        'INSERT INTO conversations (role, encrypted_content) VALUES (?, ?)',
        [role, encrypted]
    );
}

export async function getRecentMessages(limit = 10) {
    const database = await getDb();
    const rows = await database.all(
        'SELECT role, encrypted_content FROM conversations ORDER BY timestamp DESC LIMIT ?',
        [limit]
    );
    // Reverse to get chronological order
    return rows.reverse().map(row => ({
        role: row.role as 'user' | 'agent',
        content: decrypt(row.encrypted_content)
    }));
}

// Tasks Helpers
export async function addTask(title: string, priority = 'normal') {
    const database = await getDb();
    const encrypted = encrypt(title);
    await database.run(
        'INSERT INTO tasks (encrypted_title, priority) VALUES (?, ?)',
        [encrypted, priority]
    );
}

export async function getTasks() {
    const database = await getDb();
    const rows = await database.all('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows.map(row => ({
        id: row.id,
        title: decrypt(row.encrypted_title),
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at
    }));
}

// Analytics
export async function logAction(action: string, tokens = 0) {
    const database = await getDb();
    await database.run(
        'INSERT INTO analytics (action, tokens) VALUES (?, ?)',
        [action, tokens]
    );
}
