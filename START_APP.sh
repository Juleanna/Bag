#!/bin/bash
# BugTracker — start Frontend + Backend

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== BugTracker Launcher ==="
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js not found"; exit 1; }
command -v python3 >/dev/null 2>&1 && PY=python3 || PY=python
command -v $PY >/dev/null 2>&1 || { echo "[ERROR] Python not found"; exit 1; }

echo "[OK] Node.js found"
echo "[OK] Python found ($PY)"
echo ""

case "${1:-all}" in
  backend)
    echo "Starting Django backend..."
    cd "$ROOT"
    if [ -f venv/bin/activate ]; then
      source venv/bin/activate
    else
      $PY -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
    fi
    $PY manage.py migrate --run-syncdb 2>/dev/null
    $PY manage.py runserver
    ;;
  frontend)
    echo "Starting Vite frontend..."
    cd "$ROOT/frontend"
    npm run dev
    ;;
  install)
    echo "Installing dependencies..."
    cd "$ROOT"
    $PY -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    $PY manage.py migrate
    cd "$ROOT/frontend"
    npm install
    echo "[OK] All dependencies installed!"
    ;;
  all|*)
    echo "Starting Backend + Frontend..."
    echo ""
    echo "  Backend:  http://localhost:8000"
    echo "  Frontend: http://localhost:5173"
    echo "  API Docs: http://localhost:8000/api/docs/"
    echo ""

    # Start backend in background
    cd "$ROOT"
    if [ -f venv/bin/activate ]; then
      source venv/bin/activate
    else
      $PY -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
    fi
    $PY manage.py migrate --run-syncdb 2>/dev/null
    $PY manage.py runserver &
    BACKEND_PID=$!

    sleep 2

    # Start frontend
    cd "$ROOT/frontend"
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo "Press Ctrl+C to stop both servers"

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
    wait
    ;;
esac
