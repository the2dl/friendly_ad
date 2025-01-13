from flask import Flask, request, jsonify, g
from flask_cors import CORS
import ldap
import os
from dotenv import load_dotenv
from .admin_routes import admin_bp
from .database import get_db, decrypt_password, init_db
from functools import wraps

load_dotenv()

app = Flask(__name__)

# Update CORS configuration to include Vite's development server
if os.getenv('FLASK_ENV') == 'development':
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173"],  # Vite's default dev server port
            "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
            "allow_headers": ["Content-Type", "X-Admin-Key", "X-API-Key"],
            "supports_credentials": True
        }
    })
else:
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost", "http://127.0.0.1"],
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
API_KEY = os.getenv("API_KEY")

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if os.getenv('FLASK_ENV') == 'development':
            print(f"Received API key: {api_key}")  # Add this for debugging
            print(f"Expected API key: {API_KEY}")  # Add this for debugging
            print(f"Headers: {request.headers}")    # Add this for debugging
        
        if not api_key or api_key != API_KEY:
            return jsonify({"error": "Invalid or missing API key"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/search', methods=['GET'])
@require_api_key
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

        def safe_decode(value):
            if isinstance(value, bytes):
                return value.decode('utf-8')
            return str(value)

        def get_attr(attr_name, default=None):
            values = attrs.get(attr_name, [default])
            if not values:
                return None
            value = values[0] if isinstance(values, list) else values
            return safe_decode(value) if value else None

        def get_list_attr(attr_name):
            values = attrs.get(attr_name, [])
            return [safe_decode(v) for v in values] if values else []

        formatted_entry = {
            "id": entry[0],
            "name": get_attr('name'),
            "email": get_attr('mail'),
            "department": get_attr('department'),
            "title": get_attr('title'),
            "phone": get_attr('telephoneNumber'),
            "manager": get_attr('manager'),
            "street": get_attr('streetAddress'),
            "city": get_attr('l'),
            "state": get_attr('st'),
            "postalCode": get_attr('postalCode'),
            "country": get_attr('co'),
            "memberOf": get_list_attr('memberOf'),
            "created": get_attr('whenCreated'),
            "lastModified": get_attr('whenChanged'),
            "samAccountName": get_attr('sAMAccountName'),
            "userPrincipalName": get_attr('userPrincipalName'),
            "enabled": not bool(int(get_attr('userAccountControl', '0'))) & 2 if attrs.get('userAccountControl') else None,
            "lastLogon": get_attr('lastLogon'),
            "pwdLastSet": get_attr('pwdLastSet'),
            "company": get_attr('company'),
            "employeeID": get_attr('employeeID'),
            "employeeType": get_attr('employeeType'),
        }
        # Only return entries that have at least a name
        return formatted_entry if formatted_entry["name"] else None
    except Exception as e:
        print(f"Error formatting user: {e}")
        return None

def format_group(entry):
    try:
        # Convert entry[1] to dict if it's a list of tuples
        attrs = {}
        if isinstance(entry[1], list):
            for attr in entry[1]:
                if len(attr) >= 2:
                    attrs[attr[0]] = attr[1]
        else:
            attrs = entry[1]

        # Skip entries that don't have a name
        if not attrs.get('name'):
            return None

        group_type = attrs.get('groupType', [b'0'])[0]
        if group_type:
            group_type = int(group_type.decode('utf-8'))
            type_str = 'security' if group_type == -2147483643 else 'distribution'
        else:
            type_str = 'unknown'

        formatted_entry = {
            "id": entry[0],
            "name": attrs.get('name', [None])[0].decode('utf-8') if attrs.get('name', [None])[0] else None,
            "description": attrs.get('description', [None])[0].decode('utf-8') if attrs.get('description', [None])[0] else None,
            "type": type_str,
            "members": [member.decode('utf-8') for member in attrs.get('member', [])],
            "owner": attrs.get('managedBy', [None])[0].decode('utf-8') if attrs.get('managedBy', [None])[0] else None,
            "created": attrs.get('whenCreated', [None])[0].decode('utf-8') if attrs.get('whenCreated', [None])[0] else None,
            "lastModified": attrs.get('whenChanged', [None])[0].decode('utf-8') if attrs.get('whenChanged', [None])[0] else None,
        }

        # Only return groups that have at least a name
        if formatted_entry["name"]:
            return formatted_entry
        return None

    except Exception as e:
        print(f"Error formatting group: {e}")
        return None

def search_ldap(ldap_conn, search_filter, attributes, base_dn=None, page_size=1000):
    """Modified to handle pagination"""
    try:
        if not ldap_conn:
            return {
                "status": "error",
                "results": None,
                "error": "No LDAP connection",
                "truncated": False
            }
            
        ldap_conn.set_option(ldap.OPT_REFERRALS, 0)
        
        # Initialize variables for paging
        all_results = []
        page_cookie = ''
        has_more = True
        
        # Set up paging control
        lc = ldap.controls.SimplePagedResultsControl(True, size=page_size, cookie='')
        
        while has_more:
            msgid = ldap_conn.search_ext(
                base_dn,
                ldap.SCOPE_SUBTREE,
                search_filter,
                attributes,
                serverctrls=[lc]
            )
            
            rtype, rdata, rmsgid, serverctrls = ldap_conn.result3(msgid)
            all_results.extend(rdata)
            
            # Get cookie from page control
            pctrls = [c for c in serverctrls if c.controlType == ldap.controls.SimplePagedResultsControl.controlType]
            if pctrls:
                has_more = bool(pctrls[0].cookie)
                lc.cookie = pctrls[0].cookie
            else:
                has_more = False
        
        return {
            "status": "success",
            "results": all_results,
            "total_count": len(all_results),
            "truncated": False
        }
        
    except ldap.LDAPError as e:
        print(f"LDAP Search Error: {e}")
        return {
            "status": "error",
            "results": None,
            "error": str(e),
            "truncated": False
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
            search_filter = f"(&(objectClass=user)(|(name=*{escaped_query}*)(mail=*{escaped_query}*)(sAMAccountName=*{escaped_query}*)(userPrincipalName=*{escaped_query}*)(employeeID=*{escaped_query}*)))"  # Added closing parenthesis

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
@require_api_key
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
@require_api_key
def get_domains():
    with get_db() as db:
        cursor = db.cursor()
        cursor.execute('SELECT id, name FROM domains WHERE is_active = 1')
        domains = cursor.fetchall()
        return jsonify([{'id': d[0], 'name': d[1]} for d in domains])

@app.route('/groups/<group_id>/members', methods=['GET'])
@require_api_key
def get_group_members(group_id):
    """New endpoint specifically for fetching group members"""
    connection_info = get_ldap_connection()
    if not connection_info or not connection_info[0]:
        return {"error": "Could not connect to LDAP server"}, 500

    ldap_conn, base_dn = connection_info
    search_filter = f"(&(objectClass=user)(memberOf={escape_ldap_filter(group_id)}))"
    attributes = ['name', 'mail', 'department', 'title', 'telephoneNumber', 
                 'manager', 'streetAddress', 'l', 'st', 'postalCode', 'co', 
                 'memberOf', 'whenCreated', 'whenChanged', 'sAMAccountName', 
                 'userPrincipalName', 'userAccountControl', 'lastLogon', 
                 'pwdLastSet', 'company', 'employeeID', 'employeeType']
    
    ldap_results = search_ldap(ldap_conn, search_filter, attributes, base_dn)
    close_ldap(ldap_conn)

    if ldap_results["status"] == "success":
        users = [format_user(entry) for entry in ldap_results["results"] if format_user(entry)]
        return jsonify({
            "data": users,
            "total_count": ldap_results.get("total_count", len(users))
        })
    
    return {"error": "Failed to fetch group members"}, 500

if __name__ == '__main__':
    app.run(debug=True, port=4501, host='0.0.0.0')