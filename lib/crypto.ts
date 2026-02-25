import crypto from 'crypto';

// Use a static ENCRYPTION_KEY or generate/store one securely in real-world
// For this local app, we check env or use a fallback (32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex').length === 32
        ? Buffer.from(ENCRYPTION_KEY, 'hex')
        : crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return JSON.stringify({
        iv: iv.toString('hex'),
        content: encrypted,
        authTag: authTag,
    });
}

export function decrypt(hash: string): string {
    try {
        const data = JSON.parse(hash);
        const iv = Buffer.from(data.iv, 'hex');
        const authTag = Buffer.from(data.authTag, 'hex');
        const encryptedText = Buffer.from(data.content, 'hex');

        const key = Buffer.from(ENCRYPTION_KEY, 'hex').length === 32
            ? Buffer.from(ENCRYPTION_KEY, 'hex')
            : crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (e) {
        console.error("Failed to decrypt data", e);
        return "";
    }
}
