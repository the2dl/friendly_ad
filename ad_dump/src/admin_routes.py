# ad_dump/src/admin_routes.py
from flask import Blueprint, request, jsonify
from functools import wraps
import os
from .database import get_db, encrypt_password, decrypt_password

admin_bp = Blueprint('admin', __name__)

def require_admin_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('X-Admin-Key')
        if not auth_header:
            return jsonify({"error": "Missing admin key"}), 401
            
        with get_db() as db:
            cursor = db.cursor()
            cursor.execute('SELECT value FROM settings WHERE key = "admin_key"')
            result = cursor.fetchone()
            
            if not result or auth_header != result[0]:
                return jsonify({"error": "Unauthorized"}), 401
                
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/domains', methods=['GET'])
@require_admin_key
def list_domains():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT id, name, server, base_dn, username, is_active FROM domains')
        domains = cursor.fetchall()
        return jsonify([{
            'id': d[0],
            'name': d[1],
            'server': d[2],
            'base_dn': d[3],
            'username': d[4],
            'is_active': bool(d[5])
        } for d in domains])

@admin_bp.route('/domains', methods=['POST'])
@require_admin_key
def add_domain():
    data = request.json
    required_fields = ['name', 'server', 'base_dn', 'username', 'password']
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    encrypted_password = encrypt_password(data['password'])
    
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('''
        INSERT INTO domains (name, server, base_dn, username, password)
        VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data['server'], data['base_dn'], 
              data['username'], encrypted_password))
        db.commit()
        
    return jsonify({"message": "Domain added successfully"}), 201

@admin_bp.route('/setup-status', methods=['GET'])
def check_setup():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT value FROM settings WHERE key = "admin_key"')
        result = cursor.fetchone()
        return jsonify({"isSetup": result is not None})

@admin_bp.route('/setup', methods=['POST'])
def initial_setup():
    data = request.json
    if not data or 'adminKey' not in data:
        return jsonify({"error": "Missing admin key"}), 400
        
    with get_db() as db:
        cursor = db.cursor()
        # Check if key already exists
        cursor.execute('SELECT value FROM settings WHERE key = "admin_key"')
        if cursor.fetchone():
            return jsonify({"error": "Admin key already set"}), 400
            
        # Set the initial admin key
        cursor.execute('INSERT INTO settings (key, value) VALUES (?, ?)', 
                      ('admin_key', data['adminKey']))
        db.commit()
        
    return jsonify({"message": "Admin key set successfully"}), 201

@admin_bp.route('/domains/<int:domain_id>', methods=['DELETE'])
@require_admin_key
def delete_domain(domain_id):
    with get_db() as db:
        cursor = db.cursor()
        # Instead of actually deleting, we'll set is_active to 0
        cursor.execute('UPDATE domains SET is_active = 0 WHERE id = ?', (domain_id,))
        db.commit()
        
    return '', 204