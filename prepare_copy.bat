@echo off
echo ======================================================
echo PREPARANDO PROYECTO PARA COPIAR - Shift Manager
echo ======================================================
echo.
echo Este script eliminara las carpetas temporales (node_modules, bin, obj)
echo para que el proyecto sea ligero y facil de copiar.
echo.
pause

echo Limpiando carpetas del Servidor...
rmdir /s /q "Shift_Manager.Server\bin"
rmdir /s /q "Shift_Manager.Server\obj"

echo Limpiando carpetas del Cliente...
rmdir /s /q "shift_manager.client\node_modules"
rmdir /s /q "shift_manager.client\dist"

echo Limpiando dependencias de la raiz...
rmdir /s /q "node_modules"

echo Limpiando temporales de Visual Studio...
rmdir /s /q ".vs"

echo.
echo ======================================================
echo PROCESO COMPLETADO
echo Ahora puedes comprimir la carpeta del proyecto y llevarla
echo a otro dispositivo. No olvides seguir los pasos en:
echo MIGRATION_GUIDE.md
echo ======================================================
pause
