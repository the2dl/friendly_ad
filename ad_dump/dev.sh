#!/bin/bash

# Set development environment
export FLASK_ENV=development

# Start the Flask backend
echo "Starting Flask backend..."
python3 main.py &
FLASK_PID=$!

# Navigate to the frontend directory and start it
echo "Starting frontend..."
cd ../ || exit 1
npm run dev &
NPM_PID=$!

# Wait for both processes
wait $FLASK_PID $NPM_PID