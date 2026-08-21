@echo off
rem tasinmakistiyorum.com - tek tikla baslatma (Windows)
cd /d "%~dp0"
title tasinmakistiyorum.com

where node >nul 2>nul
if errorlevel 1 (
  echo HATA: Node.js kurulu degil.
  echo Lutfen https://nodejs.org adresinden LTS surumunu kurup tekrar deneyin.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Paketler indiriliyor... Internet hizina gore uzun surebilir, lutfen bekleyin.
  call npm install
  if errorlevel 1 (
    echo HATA: Paket indirme basarisiz oldu. Internet baglantinizi kontrol edip tekrar deneyin.
    pause
    exit /b 1
  )
)

if not exist .env copy .env.example .env >nul

if not exist prisma\dev.db (
  echo Veritabani kuruluyor...
  call npm run setup
  if errorlevel 1 (
    echo HATA: Veritabani kurulumu basarisiz oldu.
    pause
    exit /b 1
  )
)

echo.
echo Site birazdan tarayicinizda acilacak: http://localhost:7075
echo BU PENCEREYI KAPATMAYIN - kapatirsaniz site durur.
echo.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:7075"
call npm run dev
pause
