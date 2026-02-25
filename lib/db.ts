import { encrypt, decrypt } from './crypto';
import path from 'path';
import fs from 'fs';

// In-memory fallback for Vercel/Serverless environments
const mockDb = {
    conversations: [] as any[],
    tasks: [] as any[],
    analytics: [] as any[]
};

let db: any = null;

export async function getDb() {
    // Force mock DB on Vercel to avoid SQLite native binary issues
    if (process.env.VERCEL) {
        return 'mock';
    }

    if (db) return db;

    try {
        // Dynamically import to prevent Vercel/Webpack from strictly binding native modules
        const sqlite3 = require('sqlite3');
        const { open } = require('sqlite');

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
    } catch (e) {
        console.warn("SQLite not available, using in-memory mock DB");
        return 'mock';
    }
}

// Conversation Helpers
export async function addMessage(role: 'user' | 'agent', content: string) {
    const database = await getDb();
    const encrypted = encrypt(content);

    if (database === 'mock') {
        mockDb.conversations.push({
            id: mockDb.conversations.length + 1,
            role,
            encrypted_content: encrypted,
            timestamp: new Date().toISOString()
        });
        return;
    }

    await database.run(
        'INSERT INTO conversations (role, encrypted_content) VALUES (?, ?)',
        [role, encrypted]
    );
}

export async function getRecentMessages(limit = 10) {
    const database = await getDb();

    let rows;
    if (database === 'mock') {
        rows = [...mockDb.conversations].reverse().slice(0, limit);
        rows.reverse(); // put it back into chronological order
    } else {
        const result = await database.all(
            'SELECT role, encrypted_content FROM conversations ORDER BY timestamp DESC LIMIT ?',
            [limit]
        );
        rows = result.reverse();
    }

    return rows.map((row: any) => ({
        role: row.role as 'user' | 'agent',
        content: row.encrypted_content ? decrypt(row.encrypted_content) : ''
    }));
}

// Tasks Helpers
export async function addTask(title: string, priority = 'normal') {
    const database = await getDb();
    const encrypted = encrypt(title);

    if (database === 'mock') {
        mockDb.tasks.push({
            id: mockDb.tasks.length + 1,
            encrypted_title: encrypted,
            status: 'pending',
            priority,
            created_at: new Date().toISOString()
        });
        return;
    }

    await database.run(
        'INSERT INTO tasks (encrypted_title, priority) VALUES (?, ?)',
        [encrypted, priority]
    );
}

export async function getTasks() {
    const database = await getDb();

    let rows;
    if (database === 'mock') {
        rows = [...mockDb.tasks].reverse();
    } else {
        rows = await database.all('SELECT * FROM tasks ORDER BY created_at DESC');
    }

    return rows.map((row: any) => ({
        id: row.id,
        title: decrypt(row.encrypted_title),
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at || row.createdAt
    }));
}

// Analytics
export async function logAction(action: string, tokens = 0) {
    const database = await getDb();

    if (database === 'mock') {
        mockDb.analytics.push({
            id: mockDb.analytics.length + 1,
            action,
            tokens,
            timestamp: new Date().toISOString()
        });
        return;
    }

    await database.run(
        'INSERT INTO analytics (action, tokens) VALUES (?, ?)',
        [action, tokens]
    );
}
