import subprocess
from src.database import init_db

def run_flask_app():
    try:
        # Initialize the database before starting the app
        init_db()
        print("Database initialized successfully")
        
        # Run the Flask app
        subprocess.run(["python", "-m", "src.app"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running Flask app: {e}")
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    run_flask_app()