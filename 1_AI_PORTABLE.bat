@echo off
title SAPA BPS - [1] Local AI Portable Server (Port 1234)
color 0A
cd /d "%~dp0"
echo ===================================================================
echo   SAPA BPS KAB. BANGKA - [1] LOCAL AI SERVER (PORTABLE QWEN2-VL)
echo ===================================================================
echo.
echo [INFO] Menjalankan Mesin AI Qwen2-VL di Port 1234...
echo [INFO] Berjalan mandiri tanpa perlu aplikasi Bionic / LM Studio!
echo [PENTING] JANGAN TUTUP jendela hitam ini selama bot digunakan.
echo.
"%~dp0bin\llama-server\llama-server.exe" -m "%~dp0models\Qwen2-VL-2B-Instruct-Q4_K_S.gguf" --mmproj "%~dp0models\mmproj-Qwen2-VL-2B-Instruct-f32.gguf" --port 1234 -c 2048
echo.
echo [ERROR / INFO] Mesin AI terhenti.
pause
