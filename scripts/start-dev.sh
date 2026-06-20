#!/bin/bash
# Development startup script for Certificate DApp

echo "🚀 Starting Certificate Verification DApp..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Starting Hardhat Blockchain...${NC}"
# This would typically be run in a separate terminal
# cd packages/contracts && npm run node &

echo -e "${BLUE}Step 2: Deploying Smart Contracts...${NC}"
# cd packages/contracts && npm run deploy

echo -e "${BLUE}Step 3: Starting Backend API...${NC}"
# This would typically be run in a separate terminal
# cd packages/backend && npm run dev &

echo -e "${BLUE}Step 4: Starting Frontend...${NC}"
# cd packages/frontend && npm run dev &

echo -e "${GREEN}✅ All services should be starting...${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}Blockchain: http://localhost:8545${NC}"

echo ""
echo "🔧 Manual startup commands:"
echo "1. Terminal 1: cd packages/contracts && npm run node"
echo "2. Terminal 2: cd packages/contracts && npm run deploy"  
echo "3. Terminal 3: cd packages/backend && npm run dev"
echo "4. Terminal 4: cd packages/frontend && npm run dev"
