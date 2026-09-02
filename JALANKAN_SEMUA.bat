@echo off
title SAPA BPS - 1-Click Launcher Terpadu
color 0F
cd /d "%~dp0"
echo ===================================================================
echo   SAPA BPS KAB. BANGKA - 1-CLICK LAUNCHER SEMUA LAYANAN
echo ===================================================================
echo.
echo [1/3] Memeriksa Server AI Lokal (Port 1234)...
netstat -ano | findstr :1234 >nul
if %errorlevel% neq 0 (
    echo [INFO] Menyalakan Server AI Qwen2-VL Portable...
    start "SAPA BPS - [1] AI Portable Server" cmd /k ""%~dp01_AI_PORTABLE.bat""
    timeout /t 5 /nobreak >nul
) else (
    echo [OK] Server AI di port 1234 sudah aktif!
)

echo.
echo [2/3] Menjalankan Web Admin & NLP Engine di Terminal Terpisah...
start "SAPA BPS - [2] Web Admin & NLP" cmd /k ""%~dp02_WEB_ADMIN_NLP.bat""

echo.
echo [3/3] Menjalankan Bot WhatsApp di Terminal Terpisah...
timeout /t 2 /nobreak >nul
start "SAPA BPS - [3] Bot WhatsApp" cmd /k ""%~dp03_BOT_WHATSAPP.bat""

echo.
echo ===================================================================
echo   SEMUA 3 LAYANAN BERHASIL DIJALANKAN DALAM JENDELA TERPISAH!
echo ===================================================================
echo Tips: Anda bisa restart bagian Web Admin / WhatsApp secara terpisah
echo       tanpa perlu mematikan mesin AI di RAM.
echo.
timeout /t 3
