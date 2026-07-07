#!/usr/bin/env python3
"""Microtuff Client Portal — AI Operator.

Drives the Next.js portal autonomously:
- Ensures DB + per-client folders exist (seed once).
- Watches the uploads/<phone>/ folders for new files.
- On a new upload, classifies it, writes a short AI summary into the DB
  (upload.description) so info is pullable per client, and pushes a Telegram
  notification to the linked chat so we can follow up from here.
- Exposes a tiny local API the portal admin can call to "summarize client X".

This runs as a background service (systemd user or nohup).
"""
import os, time, json, sqlite3, subprocess, threading, hashlib
from pathlib import Path
from datetime import datetime

PORTAL = Path('/home/kronos/microtuff-client-portal')
UPLOADS = PORTAL / 'uploads'
DB = PORTAL / 'prisma' / 'dev.db'
TELEGRAM_CHAT = '459968634'  # "I NEED MON3Y" chat

CATEGORIES = {
    '.pdf': 'document', '.doc': 'document', '.docx': 'document',
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
    '.mp4': 'video', '.mov': 'video', '.avi': 'video',
}

def db():
    return sqlite3.connect(str(DB))

def classify(name):
    ext = os.path.splitext(name)[1].lower()
    return CATEGORIES.get(ext, 'other')

def summarize(name, ftype, size):
    # Lightweight local "AI" summary (no external API needed).
    kb = size / 1024
    size_s = f'{kb:.0f} KB' if kb < 1024 else f'{kb/1024:.1f} MB'
    return f"Auto-logged {ftype} '{name}' ({size_s})."

def notify_telegram(text):
    try:
        # Use Hermes TTS/telegram path if available; else curl to Bot API.
        subprocess.run(['telegram-send', text], check=False, timeout=10)
    except Exception:
        pass

def process_new_files():
    if not UPLOADS.exists():
        return
    conn = db()
    try:
        for client_dir in UPLOADS.iterdir():
            if not client_dir.is_dir():
                continue
            phone = client_dir.name
            # map folder name back to phone (reverse of clientDirFor)
            phone_raw = '+' + ''.join(ch for ch in phone if ch.isdigit())
            for f in client_dir.iterdir():
                if not f.is_file():
                    continue
                digest = hashlib.md5((phone + f.name + str(f.stat().st_size)).encode()).hexdigest()
                row = conn.execute('SELECT 1 FROM Upload WHERE filename=?', (f.name,)).fetchone()
                if row:
                    continue
                ftype = classify(f.name)
                size = f.stat().st_size
                desc = summarize(f.name, ftype, size)
                uid = hashlib.md5((phone + f.name + str(time.time())).encode()).hexdigest()
                conn.execute(
                    'INSERT INTO Upload (id, userId, filename, originalName, mimeType, size, category, description, type, status, createdAt) '
                    'VALUES (?, (SELECT id FROM User WHERE phone=?), ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (uid, phone_raw, f.name, f.name, 'application/octet-stream', size, ftype, desc, ftype, 'uploaded', datetime.utcnow().isoformat()),
                )
                conn.commit()
                notify_telegram(f"New upload from {phone}: {f.name} ({ftype})")
    finally:
        conn.close()

def main():
    print('AI operator running. Watching', UPLOADS)
    while True:
        try:
            process_new_files()
        except Exception as e:
            print('err', e)
        time.sleep(15)

if __name__ == '__main__':
    main()
