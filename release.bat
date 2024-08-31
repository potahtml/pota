@echo off

:: publish pota
call node --no-warnings ./release.mjs

:: publish docs
cd ../pota.docs/
call release.bat

