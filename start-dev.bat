@echo off
echo Starting Connect Converse Development Environment...
echo.

REM Start backend server
echo Starting Backend Server...
start cmd /k "cd server && npm start"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend
echo Starting Frontend...
start cmd /k "npm run dev"

echo.
echo ========================================
echo Connect Converse is starting!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
