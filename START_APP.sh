#!/bin/bash
# Запуск BugTracker Frontend + Backend

# Терминал 1: Backend (Django)
echo "🚀 Запуск Django..."
cd c:\Bag
python manage.py runserver

# Терминал 2: Frontend (Vite)
echo "🎨 Запуск Vite..."
cd c:\Bag\frontend
npm install  # (если первый раз)
npm run dev

# После этого:
# 🌐 Откроется: http://localhost:5173 (Frontend)
# 📡 Django API: http://localhost:8000/api (Backend)
# 🛠️ Admin: http://localhost:8000/admin
