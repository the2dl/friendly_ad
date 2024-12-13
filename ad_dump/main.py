import subprocess

def run_flask_app():
    try:
        subprocess.run(["python", "src/app.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running Flask app: {e}")

if __name__ == "__main__":
    run_flask_app()