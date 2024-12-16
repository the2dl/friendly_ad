# ad_dump/src/database.py
import sqlite3
from contextlib import contextmanager
import os
from cryptography.fernet import Fernet

# Create a secure key for encryption
KEY_FILE = "secret.key"
if not os.path.exists(KEY_FILE):
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(Fernet.generate_key())

with open(KEY_FILE, "rb") as key_file:
    KEY = key_file.read()
    
cipher_suite = Fernet(KEY)

@contextmanager
def get_db():
    db = sqlite3.connect('ad_config.db')
    try:
        yield db
    finally:
        db.close()

def init_db():
    with get_db() as db:
        db.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        ''')
        
        db.execute('''
        CREATE TABLE IF NOT EXISTS domains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            server TEXT NOT NULL,
            base_dn TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        )
        ''')
        db.commit()

def encrypt_password(password):
    return cipher_suite.encrypt(password.encode()).decode()

def decrypt_password(encrypted):
    try:
        return cipher_suite.decrypt(encrypted.encode()).decode()
    except Exception as e:
        raise