from flask import Flask, request, jsonify, g
from flask_caching import Cache
from flask_cors import CORS
from datetime import timedelta
import ldap
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/search": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET"],
        "allow_headers": ["Content-Type"]
    },
    r"/groups/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET"],
        "allow_headers": ["Content-Type"]
    }
})

# Check for a NO_CACHE environment variable
NO_CACHE = os.getenv("NO_CACHE", "False").lower() == "true"

if NO_CACHE:
    # Disable caching
    cache = Cache(app, config={'CACHE_TYPE': 'null'})
    print("Caching disabled")
else:
    # Use simple caching with a 24-hour timeout
    cache = Cache(app, config={'CACHE_TYPE': 'simple', 'CACHE_DEFAULT_TIMEOUT': 86400})
    print("Caching enabled")

LDAP_SERVER = os.getenv("LDAP_SERVER")
LDAP_USER = os.getenv("LDAP_USER")
LDAP_PASSWORD = os.getenv("LDAP_PASSWORD")
LDAP_BASE_DN = os.getenv("LDAP_BASE_DN")


def get_ldap_connection():
    try:
        ldap_conn = ldap.initialize(LDAP_SERVER)
        ldap_conn.set_option(ldap.OPT_REFERRALS, 0)
        ldap_conn.simple_bind_s(LDAP_USER, LDAP_PASSWORD)
        print("LDAP connection established")
        return ldap_conn
    except ldap.LDAPError as e:
        print(f"LDAP Connection Error: {e}")
        return None

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

def search_ldap(ldap_conn, search_filter, attributes):
    try:
        ldap_conn.set_option(ldap.OPT_REFERRALS, 0)
        results = ldap_conn.search_s(LDAP_BASE_DN, ldap.SCOPE_SUBTREE, search_filter, attributes)
        return results
    except ldap.LDAPError as e:
        print(f"LDAP Search Error: {e}")
        return None

@app.route('/search', methods=['GET'])
def search():
    search_query = request.args.get('query', '')
    search_type = request.args.get('type', '')
    
    if NO_CACHE:
        print("Cache bypassed")
        results = perform_search(search_query, search_type)
        return jsonify(results)

    cache_key = f"{search_type}:{search_query}"
    cached_results = cache.get(cache_key)

    if cached_results:
        print("Cache hit")
        return jsonify(cached_results)

    results = perform_search(search_query, search_type)

    if results:
        cache.set(cache_key, results)
        print("Cache miss, data cached")
        return jsonify(results)
    else:
        return jsonify([]), 200

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

def perform_search(search_query, search_type):
    ldap_conn = get_ldap_connection()
    if not ldap_conn:
        return {"error": "Could not connect to LDAP server"}, 500

    # Escape the search query
    escaped_query = escape_ldap_filter(search_query)
    
    results = []
    if search_type == 'users':
        search_filter = f"(&(objectClass=user)(|(name=*{escaped_query}*)(mail=*{escaped_query}*)(sAMAccountName=*{escaped_query}*)))"
        attributes = ['name', 'mail', 'department', 'title', 'telephoneNumber', 
                     'manager', 'streetAddress', 'l', 'st', 'postalCode', 'co', 
                     'memberOf', 'whenCreated', 'whenChanged',
                     'sAMAccountName', 'userPrincipalName', 'userAccountControl',
                     'lastLogon', 'pwdLastSet', 'company', 'employeeID', 'employeeType']
    elif search_type == 'groups':
        search_filter = f"(&(objectClass=group)(|(name=*{escaped_query}*)(description=*{escaped_query}*)))"
        attributes = ['name', 'description', 'groupType', 'member', 'managedBy', 'whenCreated', 'whenChanged']
    elif search_type == 'group_members':
        search_filter = f"(&(objectClass=user)(memberOf={escaped_query}))"
        attributes = ['name', 'mail', 'department', 'title', 'telephoneNumber', 
                     'manager', 'streetAddress', 'l', 'st', 'postalCode', 'co', 
                     'memberOf', 'whenCreated', 'whenChanged',
                     'sAMAccountName', 'userPrincipalName', 'userAccountControl',
                     'lastLogon', 'pwdLastSet', 'company', 'employeeID', 'employeeType']

    ldap_results = search_ldap(ldap_conn, search_filter, attributes)
    if ldap_results:
        if search_type in ['users', 'group_members']:
            valid_results = [entry for entry in ldap_results if entry[0] is not None]
            results = [format_user(entry) for entry in valid_results if format_user(entry)]
        elif search_type == 'groups':
            results = [format_group(entry) for entry in ldap_results if format_group(entry)]

    close_ldap(ldap_conn)
    return results

@app.teardown_appcontext
def teardown_ldap(exception):
    pass

@app.route('/groups/<group_id>', methods=['GET'])
def get_group_details(group_id):
    ldap_conn = get_ldap_connection()
    if not ldap_conn:
        return {"error": "Could not connect to LDAP server"}, 500

    # Search for the specific group by distinguishedName (which is the id)
    search_filter = f"(distinguishedName={escape_ldap_filter(group_id)})"
    attributes = ['name', 'description', 'groupType', 'member', 'managedBy', 'whenCreated', 'whenChanged']
    
    ldap_results = search_ldap(ldap_conn, search_filter, attributes)
    close_ldap(ldap_conn)

    if ldap_results and len(ldap_results) > 0:
        group = format_group(ldap_results[0])
        if group:
            return jsonify(group)
    
    return {"error": "Group not found"}, 404

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')