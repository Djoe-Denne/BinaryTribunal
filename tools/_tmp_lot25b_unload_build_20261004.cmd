@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x86 >nul
if errorlevel 1 exit /b %errorlevel%
cl /nologo /W3 /O2 /MT harness_lot25b_unload.c /Fe:harness_lot25b_unload.exe /link /MAP:harness_lot25b_unload.map
exit /b %errorlevel%
