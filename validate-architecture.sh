#!/bin/bash
# Script de validación de la arquitectura de Settings

echo "✅ Validando estructura de carpetas..."

# Verificar estructura
PATHS=(
  "src/app/features/settings/shared/models"
  "src/app/features/settings/shared/components"
  "src/app/features/settings/shared/services"
  "src/app/features/settings/modules/users/services"
)

for path in "${PATHS[@]}"; do
  if [ -d "$path" ]; then
    echo "✓ $path existe"
  else
    echo "✗ $path NO existe"
  fi
done

echo ""
echo "✅ Validación completada"

