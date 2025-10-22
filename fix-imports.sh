#!/bin/bash
# Fix all relative imports to include .js extensions

find src api -name "*.ts" -type f | while read file; do
  # Add .js to relative imports
  sed -i.bak "s|from '\./\([^']*\)';|from './\1.js';|g" "$file"
  sed -i.bak "s|from '\.\./\([^']*\)';|from '../\1.js';|g" "$file"
  sed -i.bak "s|from '\.\./\.\./\([^']*\)';|from '../../\1.js';|g" "$file"
  sed -i.bak "s|from '\.\./\.\./\.\./\([^']*\)';|from '../../../\1.js';|g" "$file"

  # Remove .js.js if we accidentally doubled it
  sed -i.bak "s|\.js\.js|.js|g" "$file"

  # Remove backup files
  rm -f "$file.bak"
done

echo "Fixed all imports!"
