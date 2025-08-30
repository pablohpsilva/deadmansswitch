#!/bin/bash

# Migration script for authentication type changes
# This script safely migrates the database and updates existing users

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Dead Man's Switch - Authentication Security Migration${NC}"
echo "========================================================"

# Check if we're in the right directory
if [ ! -f "apps/backend/package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

cd apps/backend

echo -e "${YELLOW}📊 Checking current database status...${NC}"

# Apply the database migration
echo -e "${GREEN}🗃️  Applying database migration...${NC}"
pnpm run db:migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migration applied successfully${NC}"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi

# Update existing users with proper auth types
echo -e "${GREEN}👥 Updating existing users...${NC}"
tsx src/db/update-existing-users.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ User authentication types updated successfully${NC}"
else
    echo -e "${RED}❌ User update failed${NC}"
    exit 1
fi

echo
echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
echo
echo -e "${YELLOW}📋 What was changed:${NC}"
echo "✅ Added 'authType' field to distinguish email vs nostr users"
echo "✅ Email users: Keep encrypted private keys until export"
echo "✅ Nostr users: Only store public keys (private keys never stored)"
echo "✅ Enhanced security with clear authentication separation"
echo
echo -e "${YELLOW}🔒 Security improvements:${NC}"
echo "• Nostr users' private keys are NEVER stored on the server"
echo "• Email users can export their keys and remove them from the server"
echo "• Clear distinction between authentication methods"
echo "• Improved audit logging for key operations"
echo
echo -e "${GREEN}📖 See NOSTR-SECURITY-GUIDE.md for detailed information${NC}"
