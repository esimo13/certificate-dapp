# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a decentralized certificate verification DApp built with:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, App Router
- **Backend**: Express.js with certificate hashing, digital signatures, IPFS integration
- **Blockchain**: Solidity smart contracts on Hardhat (local development)
- **Database**: Supabase for metadata storage
- **Storage**: IPFS via web3.storage for certificate PDFs
- **Authentication**: Supabase Auth with email/password

## Key Features
- Admin portal for universities to issue blockchain-verified certificates
- Public verification interface using certificate hash
- Certificate PDF upload and IPFS storage
- Digital signature generation and verification
- On-chain certificate hash storage with metadata

## Development Guidelines
- Use TypeScript for type safety
- Follow Next.js App Router patterns
- Implement proper error handling and validation
- Use Tailwind CSS for styling
- Ensure secure handling of private keys and signatures
- Write modular, well-commented code
- Follow blockchain security best practices
