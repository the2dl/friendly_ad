from flask import Flask, request, jsonify, g
from flask_cors import CORS
import ldap
import os
from dotenv import load_dotenv
from .admin_routes import admin_bp
from .database import get_db, decrypt_password, init_db

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/search": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    },
    r"/groups/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    },
    r"/domains": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    },
    r"/admin/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "DELETE", "PUT"],
        "allow_headers": ["Content-Type", "X-Admin-Key"],
        "supports_credentials": True
    }
})

app.register_blueprint(admin_bp, url_prefix='/admin')

LDAP_SERVER = os.getenv("LDAP_SERVER")
LDAP_USER = os.getenv("LDAP_USER")
LDAP_PASSWORD = os.getenv("LDAP_PASSWORD")
LDAP_BASE_DN = os.getenv("LDAP_BASE_DN")

@app.route('/search', methods=['GET'])
def search():
    search_query = request.args.get('query', '')
    search_type = request.args.get('type', '')
    is_precise = request.args.get('precise', 'true').lower() == 'true'
    
    results = perform_search(search_query, search_type, is_precise)
    return jsonify(results)

def get_ldap_connection(domain_id=None):
    try:
        with get_db() as db:
            cursor = db.cursor()
            if domain_id:
                cursor.execute('''
                    SELECT server, username, password, base_dn 
                    FROM domains 
                    WHERE id = ? AND is_active = 1
                ''', (domain_id,))
            else:
                cursor.execute('''
                    SELECT server, username, password, base_dn 
                    FROM domains 
                    WHERE is_active = 1 
                    LIMIT 1
                ''')
            
            domain = cursor.fetchone()
            if not domain:
                return None, None
                
            server, username, encrypted_password, base_dn = domain
            password = decrypt_password(encrypted_password)
            
            try:
                ldap_conn = ldap.initialize(server)
                ldap_conn.set_option(ldap.OPT_REFERRALS, 0)
                ldap_conn.simple_bind_s(username, password)
                return ldap_conn, base_dn
                
            except ldap.INVALID_CREDENTIALS:
                return None, None
            
    except Exception as e:
        return None, None

def close_ldap(ldap_conn):
    if ldap_conn:
        ldap_conn.unbind_s()
        print("LDAP connection closed")

def format_user(entry):
    try:
        # Convert entry[1] to dict if it's a list of tuples
        attrs = {}
        if isinstance(entry[1], list):
            for attr in entry[1]:
                if len(attr) >= 2:
                    attrs[attr[0]] = attr[1]
        else:
            attrs = entry[1]

        formatted_entry = {
            "id": entry[0],
            "name": attrs.get('name', [b''])[0].decode('utf-8') if attrs.get('name') else None,
            "email": attrs.get('mail', [b''])[0].decode('utf-8') if attrs.get('mail') and attrs.get('mail')[0] else None,
            "department": attrs.get('department', [b''])[0].decode('utf-8') if attrs.get('department') and attrs.get('department')[0] else None,
            "title": attrs.get('title', [b''])[0].decode('utf-8') if attrs.get('title') and attrs.get('title')[0] else None,
            "phone": attrs.get('telephoneNumber', [b''])[0].decode('utf-8') if attrs.get('telephoneNumber') and attrs.get('telephoneNumber')[0] else None,
            "manager": attrs.get('manager', [b''])[0].decode('utf-8') if attrs.get('manager') else None,
            "street": attrs.get('streetAddress', [b''])[0].decode('utf-8') if attrs.get('streetAddress') else None,
            "city": attrs.get('l', [b''])[0].decode('utf-8') if attrs.get('l') else None,
            "state": attrs.get('st', [b''])[0].decode('utf-8') if attrs.get('st') else None,
            "postalCode": attrs.get('postalCode', [b''])[0].decode('utf-8') if attrs.get('postalCode') else None,
            "country": attrs.get('co', [b''])[0].decode('utf-8') if attrs.get('co') else None,
            "memberOf": [group.decode('utf-8') for group in attrs.get('memberOf', [])] if attrs.get('memberOf') else [],
            "created": attrs.get('whenCreated', [b''])[0].decode('utf-8') if attrs.get('whenCreated') else None,
            "lastModified": attrs.get('whenChanged', [b''])[0].decode('utf-8') if attrs.get('whenChanged') else None,
            "samAccountName": attrs.get('sAMAccountName', [b''])[0].decode('utf-8') if attrs.get('sAMAccountName') else None,
            "userPrincipalName": attrs.get('userPrincipalName', [b''])[0].decode('utf-8') if attrs.get('userPrincipalName') else None,
            "enabled": not bool(int(attrs.get('userAccountControl', [b'0'])[0].decode('utf-8')) & 2) if attrs.get('userAccountControl') else None,
            "lastLogon": attrs.get('lastLogon', [b''])[0].decode('utf-8') if attrs.get('lastLogon') else None,
            "pwdLastSet": attrs.get('pwdLastSet', [b''])[0].decode('utf-8') if attrs.get('pwdLastSet') else None,
            "company": attrs.get('company', [b''])[0].decode('utf-8') if attrs.get('company') else None,
            "employeeID": attrs.get('employeeID', [b''])[0].decode('utf-8') if attrs.get('employeeID') else None,
            "employeeType": attrs.get('employeeType', [b''])[0].decode('utf-8') if attrs.get('employeeType') else None,
        }
        # Convert empty strings to None
        return {k: v if v else None for k, v in formatted_entry.items()}
    except Exception as e:
        print(f"Error formatting user: {e}")
        return None

def format_group(entry):
    try:
        # Convert group type to string
        group_type = entry[1].get('groupType', [b'0'])[0]
        if group_type:
            group_type = int(group_type.decode('utf-8'))
            # -2147483646 is distribution, -2147483643 is security (you might need to adjust these values)
            type_str = 'security' if group_type == -2147483643 else 'distribution'
        else:
            type_str = 'unknown'

        formatted_entry = {
            "id": entry[0],
            "name": entry[1].get('name', [None])[0].decode('utf-8') if entry[1].get('name', [None])[0] else None,
            "description": entry[1].get('description', [None])[0].decode('utf-8') if entry[1].get('description', [None])[0] else None,
            "type": type_str,
            "members": [member.decode('utf-8') for member in entry[1].get('member', [])],
            "owner": entry[1].get('managedBy', [None])[0].decode('utf-8') if entry[1].get('managedBy', [None])[0] else None,
            "created": entry[1].get('whenCreated', [None])[0].decode('utf-8') if entry[1].get('whenCreated', [None])[0] else None,
            "lastModified": entry[1].get('whenChanged', [None])[0].decode('utf-8') if entry[1].get('whenChanged', [None])[0] else None,
        }
        return formatted_entry
    except Exception as e:
        print(f"Error formatting group: {e}")
        return None

def search_ldap(ldap_conn, search_filter, attributes, base_dn=None):
    try:
        if not ldap_conn:
            return {
                "status": "error",
                "results": None,
                "error": "No LDAP connection"
            }
            
        ldap_conn.set_option(ldap.OPT_REFERRALS, 0)
        ldap_conn.set_option(ldap.OPT_SIZELIMIT, 1000)
        
        # Use the provided base_dn instead of environment variable
        search_base = base_dn or LDAP_BASE_DN
        
        results = ldap_conn.search_s(search_base, ldap.SCOPE_SUBTREE, search_filter, attributes)
        return {
            "status": "success",
            "results": results,
            "truncated": False
        }
    except ldap.SIZELIMIT_EXCEEDED as e:
        print(f"LDAP size limit exceeded: {e}")
        partial_results = e.args[0].get('partial_results', [])
        return {
            "status": "truncated",
            "results": partial_results,
            "truncated": True
        }
    except ldap.LDAPError as e:
        print(f"LDAP Search Error: {e}")
        return {
            "status": "error",
            "results": None,
            "error": str(e)
        }

def escape_ldap_filter(search_query):
    """Escape special characters for LDAP filter"""
    special_chars = {
        '\\': r'\5c',
        '*': r'\2a',
        '(': r'\28',
        ')': r'\29',
        '\0': r'\00',
        '/': r'\2f',
        '.': r'\2e'  # Escape periods
    }
    return ''.join(special_chars.get(char, char) for char in search_query)

def perform_search(search_query, search_type, is_precise):
    # Get connection and base_dn
    connection_info = get_ldap_connection()
    if not connection_info or not connection_info[0]:
        return {"error": "Could not connect to LDAP server", "truncated": False}, 500
        
    ldap_conn, base_dn = connection_info  # Unpack the tuple

    escaped_query = escape_ldap_filter(search_query)
    search_by = request.args.get('searchBy', '')
    
    if search_type == 'users' and search_by == 'sAMAccountName':
        # Optimized path for sAMAccountName
        search_filter = f"(&(objectClass=user)(sAMAccountName={escaped_query}))"
        attributes = ['name', 'mail', 'department', 'title', 'telephoneNumber', 
                     'manager', 'streetAddress', 'l', 'st', 'postalCode', 'co', 
                     'memberOf', 'whenCreated', 'whenChanged', 'sAMAccountName', 
                     'userPrincipalName', 'userAccountControl', 'lastLogon', 
                     'pwdLastSet', 'company', 'employeeID', 'employeeType']
        
        search_results = search_ldap(ldap_conn, search_filter, attributes, base_dn)
        close_ldap(ldap_conn)

        if search_results["status"] == "error":
            return {"error": "Search failed", "truncated": False}, 500

        results = []
        if search_results["results"]:
            valid_results = [entry for entry in search_results["results"] if entry[0] is not None]
            results = [format_user(entry) for entry in valid_results if format_user(entry)]

        return {
            "data": results,
            "truncated": search_results["truncated"]
        }

    results = []
    if search_type == 'users':
        if is_precise:
            search_filter = f"(&(objectClass=user)(|(sAMAccountName={escaped_query})(userPrincipalName={escaped_query})(employeeID={escaped_query})))"
        else:
            search_filter = f"(&(objectClass=user)(|(name=*{escaped_query}*)(mail=*{escaped_query}*)(sAMAccountName=*{escaped_query}*)(userPrincipalName=*{escaped_query}*)(employeeID=*{escaped_query}*))"
        
        attributes = ['name', 'mail', 'department', 'title', 'telephoneNumber', 
                     'manager', 'streetAddress', 'l', 'st', 'postalCode', 'co', 
                     'memberOf', 'whenCreated', 'whenChanged',
                     'sAMAccountName', 'userPrincipalName', 'userAccountControl',
                     'lastLogon', 'pwdLastSet', 'company', 'employeeID', 'employeeType']
    elif search_type == 'groups':
        if is_precise:
            search_filter = f"(&(objectClass=group)(sAMAccountName={escaped_query}))"
        else:
            search_filter = f"(&(objectClass=group)(|(name=*{escaped_query}*)(description=*{escaped_query}*)))"
        
        attributes = ['name', 'description', 'groupType', 'member', 'managedBy', 'whenCreated', 'whenChanged']
    elif search_type == 'group_members':
        search_filter = f"(&(objectClass=user)(memberOf={escaped_query}))"
        attributes = ['name', 'mail', 'department', 'title', 'telephoneNumber', 
                     'manager', 'streetAddress', 'l', 'st', 'postalCode', 'co', 
                     'memberOf', 'whenCreated', 'whenChanged',
                     'sAMAccountName', 'userPrincipalName', 'userAccountControl',
                     'lastLogon', 'pwdLastSet', 'company', 'employeeID', 'employeeType']

    search_results = search_ldap(ldap_conn, search_filter, attributes, base_dn)
    close_ldap(ldap_conn)

    if search_results["status"] == "error":
        return {"error": "Search failed", "truncated": False}, 500

    results = []
    if search_results["results"]:
        if search_type in ['users', 'group_members']:
            valid_results = [entry for entry in search_results["results"] if entry[0] is not None]
            results = [format_user(entry) for entry in valid_results if format_user(entry)]
        elif search_type == 'groups':
            results = [format_group(entry) for entry in search_results["results"] if format_group(entry)]

    return {
        "data": results,
        "truncated": search_results["truncated"]
    }

@app.teardown_appcontext
def teardown_ldap(exception):
    pass

@app.route('/groups/<group_id>', methods=['GET'])
def get_group_details(group_id):
    connection_info = get_ldap_connection()
    if not connection_info or not connection_info[0]:
        return {"error": "Could not connect to LDAP server"}, 500

    ldap_conn, base_dn = connection_info
    search_filter = f"(distinguishedName={escape_ldap_filter(group_id)})"
    attributes = ['name', 'description', 'groupType', 'member', 'managedBy', 'whenCreated', 'whenChanged']
    
    ldap_results = search_ldap(ldap_conn, search_filter, attributes, base_dn)
    close_ldap(ldap_conn)

    if ldap_results["status"] == "success" and ldap_results["results"]:
        group = format_group(ldap_results["results"][0])
        if group:
            return jsonify(group)
    
    return {"error": "Group not found"}, 404

@app.route('/domains', methods=['GET'])
def get_domains():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT id, name FROM domains WHERE is_active = 1')
        domains = cursor.fetchall()
        return jsonify([{'id': d[0], 'name': d[1]} for d in domains])

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')