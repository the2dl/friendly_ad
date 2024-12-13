import ldap
import os
from dotenv import load_dotenv

load_dotenv()

LDAP_SERVER = os.getenv("LDAP_SERVER")
LDAP_USER = os.getenv("LDAP_USER")
LDAP_PASSWORD = os.getenv("LDAP_PASSWORD")

try:
    ldap_conn = ldap.initialize(LDAP_SERVER)
    ldap_conn.simple_bind_s(LDAP_USER, LDAP_PASSWORD)
    print("LDAP bind successful!")
    ldap_conn.unbind_s()
except ldap.LDAPError as e:
    print(f"LDAP bind failed: {e}") 