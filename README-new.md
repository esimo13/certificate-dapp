# Certificate Verification DApp

A decentralized application for universities to issue and verify blockchain-secured certificates.

## 🏗️ Project Structure

```
certificate-dapp/
├── packages/
│   ├── frontend/              # Next.js React application
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router pages
│   │   │   ├── components/    # Reusable React components
│   │   │   └── lib/           # Utility libraries
│   │   └── package.json
│   │
│   ├── backend/               # Express.js API server
│   │   ├── server.js          # Main server file
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   └── contracts/             # Smart contracts & blockchain
│       ├── CertificateVerification.sol
│       ├── scripts/
│       │   └── deploy.js
│       ├── hardhat.config.ts
│       └── package.json
│
├── database/                  # Database schema & migrations
├── docs/                      # Documentation
├── .env.example              # Environment variables template
└── package.json              # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- NPM/Yarn
- Supabase account
- W3UP token (optional, for IPFS)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd certificate-dapp
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

3. **Start all services:**
```bash
# Terminal 1: Start blockchain
npm run blockchain

# Terminal 2: Start backend
npm run start:backend

# Terminal 3: Start frontend
npm run start:frontend
```

## 📦 Available Scripts

### Root Level
- `npm run dev` - Start frontend development server
- `npm run start:frontend` - Start frontend
- `npm run start:backend` - Start backend API server
- `npm run blockchain` - Start Hardhat local blockchain
- `npm run deploy:contracts` - Deploy smart contracts

### Package Level
```bash
# Frontend (packages/frontend)
npm run dev --workspace=frontend
npm run build --workspace=frontend

# Backend (packages/backend)  
npm run dev --workspace=backend
npm run start --workspace=backend

# Contracts (packages/contracts)
npm run compile --workspace=contracts
npm run deploy --workspace=contracts
npm run node --workspace=contracts
```

## 🔧 Development Workflow

1. **Start Blockchain:** `npm run blockchain`
2. **Deploy Contracts:** `npm run deploy:contracts`
3. **Start Backend:** `npm run start:backend`
4. **Start Frontend:** `npm run start:frontend`

## 🏛️ Architecture

### Frontend (Next.js 15)
- **Framework:** Next.js with App Router
- **Styling:** Tailwind CSS
- **State:** React Query for server state
- **Blockchain:** Wagmi + Viem for Ethereum interaction

### Backend (Express.js)
- **API:** RESTful endpoints
- **Database:** Supabase (PostgreSQL)
- **Storage:** IPFS via web3.storage
- **Security:** Digital signatures + blockchain verification

### Smart Contracts (Solidity)
- **Network:** Hardhat local development
- **Contract:** CertificateVerification.sol
- **Functions:** Store/verify certificate hashes
- **Events:** Certificate issuance logging

## 📊 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | Supabase (PostgreSQL) |
| Blockchain | Ethereum, Hardhat, Solidity |
| Storage | IPFS (web3.storage) |
| Authentication | Supabase Auth |

## 🔐 Security Features

- ✅ Blockchain immutability
- ✅ Digital signatures (RSA)
- ✅ Certificate hash verification
- ✅ IPFS decentralized storage
- ✅ Database validation
- ✅ Admin authentication

## 📝 Usage

### Admin Portal
1. Login with university credentials
2. Fill certificate details
3. Upload PDF certificate  
4. Submit to blockchain + IPFS
5. Share certificate hash with student

### Public Verification
1. Enter certificate hash
2. View verification results
3. Download certificate PDF
4. Verify blockchain authenticity

## 🚀 Deployment

### Development
- Local Hardhat blockchain
- Development servers
- Mock IPFS integration

### Production
- Deploy to Ethereum/Polygon
- Production Next.js build
- Real IPFS storage
- Production database

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Smart Contract ABI](./docs/contracts.md)
- [Database Schema](./database/schema.sql)
- [Environment Setup](./docs/setup.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details
