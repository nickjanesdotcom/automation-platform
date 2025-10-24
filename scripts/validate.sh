#!/bin/bash

# Pre-commit validation script
# Runs tests and build to ensure code quality before committing

set -e  # Exit on any error

echo ""
echo "=================================="
echo "  Pre-Commit Validation"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Run all tests
echo -e "${YELLOW}Step 1: Running tests...${NC}"
if npm test; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
fi

echo ""

# Step 2: Run build
echo -e "${YELLOW}Step 2: Building project...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""

# Step 3: Validate build output exists
echo -e "${YELLOW}Step 3: Validating build output...${NC}"
if [ -f "api/index.mjs" ]; then
    echo -e "${GREEN}✓ Build output exists (api/index.mjs)${NC}"
else
    echo -e "${RED}✗ Build output not found (api/index.mjs)${NC}"
    exit 1
fi

# Check build output is not empty
if [ -s "api/index.mjs" ]; then
    echo -e "${GREEN}✓ Build output is not empty${NC}"
else
    echo -e "${RED}✗ Build output is empty${NC}"
    exit 1
fi

echo ""

# Step 4: Check for source maps (helpful for debugging)
if [ -f "api/index.mjs.map" ]; then
    echo -e "${GREEN}✓ Source maps generated${NC}"
else
    echo -e "${YELLOW}⚠ Source maps not found (non-critical)${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}  ✓ All validations passed!${NC}"
echo "=================================="
echo ""
echo "Your code is ready to commit."
echo ""

exit 0
