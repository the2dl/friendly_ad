# Friendly AD

A Flask-based API for securely querying Active Directory domains with a VITE/React frontend utilizing shadcn/ui. Supports multiple domains, encrypted credential storage, and flexible search capabilities.

## Screenshots

![users](screenshots/users.png)


![groups](screenshots/groups.png)

## Features

- 🔍 **Search:** Search AD users and groups with precise or fuzzy matching.
- 🔐 **Secure Storage:** Encrypts sensitive data, including AD credentials, using Fernet encryption.
- 🌐 **Multi-Domain Support:** Configure and query multiple Active Directory domains.
- 🚀 **Flexible Search:** Fast and efficient search options including both precise and fuzzy matching.
- 🛡️ **Admin Protection:**  API endpoints for administrative tasks are protected with an admin key.

## Getting Started

Follow these instructions to set up and run Friendly AD on your local machine.

# IMPORTANT

You can use the docker-compose file to run the application. All you need is the env file updated with the correct API keys. From there you can go to the admin interface at `http://localhost/` and setup a admin key. Then you can add a domain. Suggest to put a load balancer in front of the application to add SSL termination & scaling.

### Docker Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/the2dl/friendly_ad.git
    cd friendly_ad
    ```

2. **Create a `.env` file:**
    ```bash
    # Generate an encryption key
    python3 -c "from cryptography.fernet import Fernet; key = Fernet.generate_key(); print(f'ENCRYPTION_KEY={key.decode()}')" >
    ```

    See a sample at [env.sample](env.sample) - if you want to use the sample file, you can run the following command to create the file:
    ```bash
    cp env.sample .env
    ```

3. **Build and run with Docker Compose:**
    ```bash
    docker compose up -d
    ```
4. **Add Domain:**
Login to the admin interface at `http://localhost/` and add a domain. Suggest to put a load balancer in front of the application to add SSL termination & scaling.

The application will be available at `http://localhost`, with the API endpoints at `http://localhost/api/`.

### Prerequisites

- Python 3.7 or higher
- SQLite

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/the2dl/friendly_ad.git
    cd friendly_ad
    ```

2. **Create and activate a virtual environment:**

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3. **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4. **Generate an encryption key:**

    This key will be used to encrypt sensitive information in the database. Run the following Python script:

    ```python
    from cryptography.fernet import Fernet
    key = Fernet.generate_key()
    print(f"ENCRYPTION_KEY={key.decode()}")
    ```

    Copy the generated `ENCRYPTION_KEY` value.

5. **Create a `.env` file:**

    Create a `.env` file in the root directory of the project and add the following:

    ```env
    # Key for encrypting sensitive data in the database
    ENCRYPTION_KEY=your_generated_key
    
    # API key for securing endpoints (generate a secure random key)
    VITE_API_KEY=your_api_key
    API_KEY=${VITE_API_KEY}
    ```

    You can generate a secure random API key using:
    ```python
    import secrets
    print(f"VITE_API_KEY={secrets.token_hex(32)}")
    ```

    **Important:** 
    - Store the `.env` file securely and never commit it to version control
    - The API key is used by both frontend and backend to secure API endpoints
    - Keep these keys safe as they protect sensitive data and API access

### Adding Domains

Add Active Directory domains to the system using the admin API:

```bash
curl -X POST http://localhost:5001/admin/domains \
-H "Content-Type: application/json" \
-H "X-Admin-Key: your_admin_key" \
-d '{
    "name": "Domain Name",
    "server": "ldap://server:389",
    "base_dn": "dc=example,dc=com",
    "username": "cn=user,cn=users,dc=example,dc=com",
    "password": "password"
}'
```

Replace the placeholders with your domain details:

-   `name`: A friendly name for the domain.
-   `server`:  The LDAP server address (e.g., `ldap://dc.example.com:389` or  `ldaps://dc.example.com:636` for LDAPS).
-   `base_dn`:  The base distinguished name for the domain (e.g., `dc=example,dc=com`).
-   `username`: The username of an account with read access to the directory (e.g., `cn=read_only_user,cn=users,dc=example,dc=com`).
-   `password`: The password for the read-only account.

## API Endpoints

### Search

-   `GET /search?query=term&type=users|groups&precise=true|false`

    -   Search for users or groups.
    -   `query`: The search term.
    -   `type`:  Specify whether to search `users` or `groups`. Defaults to both if not specified.
    -   `precise`:  Set to `true` for exact matches, `false` for fuzzy matching (default: `false`).

### Groups

-   `GET /groups/<group_id>`

    -   Get detailed information about a specific group.
    -   `group_id`: The `objectGUID` of the group.

### Domains

-   `GET /domains`

    -   List all configured domains (non-admin).

### Admin Endpoints

These endpoints require the `X-Admin-Key` header to be set with the admin key configured during setup.

-   `POST /admin/setup`

    -   Initializes the admin key. Can only be called once unless the database is reset.

-   `GET /admin/domains`

    -   List all configured domains with details, including credentials.

-   `POST /admin/domains`

    -   Add a new domain. See "Adding Domains" above for details.

-   `DELETE /admin/domains/<id>`

    -   Deactivate a domain. This does not delete the domain data, but prevents it from being used for queries.
    -   `id`: The ID of the domain to deactivate.

## Security Notes

1. **Encryption Key:** The `ENCRYPTION_KEY` is crucial for securing sensitive data in the SQLite database. Keep it safe and do not share it.
2. **API Key:** The `VITE_API_KEY` secures all API endpoints. Choose a strong, random key and protect it like any other credential.
3. **`.env` File:** Never commit the `.env` file to version control. Treat it like any other sensitive credential.
4. **Admin Key:** The admin key provides access to sensitive administrative operations. Choose a strong, unique admin key and store it securely.
5. **Data Encryption:** All passwords and other sensitive data are encrypted at rest in the database using Fernet encryption.

## Development

1. **Run the development server:**

    ```bash
    python -m flask run --port 5001
    ```

2. **Access the API:**

    The API will be accessible at `http://localhost:5001`.

## Database Management

You can interact with the SQLite database using the `sqlite3` command-line tool:

```bash
sqlite3 ad_config.db
```

**Useful Commands:**

-   `.tables`: List all tables in the database.
-   `.schema domains`: Show the schema for the `domains` table.
-   `.headers on`: Enable column headers in the output.
-   `.mode column`:  Display output in a formatted column view.

## Contributing

Contributions are welcome!  To contribute to Friendly AD, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3. Make your changes and commit them with descriptive messages.
4. Push your branch to your forked repository.
5. Submit a pull request to the `main` branch of this repository.

## License

This project is licensed under the [MIT License](LICENSE). See the [LICENSE](LICENSE) file for details.
