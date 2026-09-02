@echo off
title SAPA BPS - [3] Bot WhatsApp Baileys
color 0E
cd /d "%~dp0"
echo ===================================================================
echo   SAPA BPS KAB. BANGKA - [3] BOT WHATSAPP CONNECTOR
echo ===================================================================
echo.
echo [INFO] Menghubungkan ke WhatsApp Multi-Device...
echo [TIPS] Terminal ini khusus menangani chat WhatsApp masuk & keluar.
echo.
call npx tsx src/botOnly.ts
pause
