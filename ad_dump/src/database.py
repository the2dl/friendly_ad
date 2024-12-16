# ad_dump/src/database.py
import sqlite3
from contextlib import contextmanager
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# Get key from environment variable
KEY = os.getenv('ENCRYPTION_KEY')
if not KEY:
    # Generate a new key if not present
    KEY = Fernet.generate_key().decode()
    print(f"Generated new encryption key: {KEY}")
    print("Add this to your .env file as ENCRYPTION_KEY=<the_key>")
    exit(1)

# Convert string key back to bytes if needed
if isinstance(KEY, str):
    KEY = KEY.encode()

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