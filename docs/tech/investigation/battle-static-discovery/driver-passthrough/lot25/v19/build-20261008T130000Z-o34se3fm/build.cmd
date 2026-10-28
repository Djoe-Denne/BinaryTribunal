@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x86 >nul
if errorlevel 1 exit /b %errorlevel%
cl /nologo /W3 /Ox /MT /LD /Zi gfx_driver_passthrough.c /Fo:gfx_driver_passthrough.obj /Fe:gfx_driver_passthrough.dll /Fd:gfx_driver_passthrough.pdb /link /INCREMENTAL:NO /OPT:NOREF /MAP:gfx_driver_passthrough.map
exit /b %errorlevel%
