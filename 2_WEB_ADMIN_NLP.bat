@echo off
title SAPA BPS - [2] Web Admin Panel & NLP Engine (Port 8000)
color 0B
cd /d "%~dp0"
echo ===================================================================
echo   SAPA BPS KAB. BANGKA - [2] WEB ADMIN CONTROL PANEL & NLP
echo ===================================================================
echo.
echo [INFO] Menjalankan Server Web Admin Dashboard & NLP Engine...
echo [INFO] Buka di browser: http://localhost:8000/admin
echo [TIPS] Jika mengubah data atau NLP, cukup restart terminal ini saja!
echo.
call npx tsx src/serverOnly.ts
pause
