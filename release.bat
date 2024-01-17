@echo off

call node --no-warnings ./releases/release.mjs

:: publish docs
cd ../pota.docs/
call release.bat

