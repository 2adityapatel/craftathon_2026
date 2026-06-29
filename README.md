# POCSO Blockchain Reporting System (Craftathon 2026)

A highly secure, privacy-preserving, and immutable reporting system designed for the Protection of Children from Sexual Offences (POCSO). This platform leverages AI for evidence triage, IPFS for decentralized storage, and Blockchain for tamper-proof case tracking, all wrapped in a high-security "Sovereign Sentinel" design aesthetic.

## Architecture Overview

The system is composed of three main layers:

1. **Frontend (`/frontend`)**: A React + Vite application tailored with a strict, dark-mode, high-contrast design system. It handles user submissions, encryption, and status tracking.
2. **Backend (`/backend`)**: A FastAPI Python server acting as the orchestration layer. It handles AI-driven evidence analysis, hybrid cryptography (RSA+AES), IPFS uploads via Pinata, and PostgreSQL database management.
3. **Blockchain (`/Blockchain`)**: A Solidity smart contract (`POCSORegistry.sol`) deployed via Hardhat. It anchors evidence hashes, IPFS CIDs, and case statuses on-chain (Sepolia) to ensure immutability.

## Prerequisites

Before running the project locally, ensure you have the following installed:
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL
- MetaMask (or another Web3 wallet for interacting with the dApp)

## Environment Variables Setup

You will need to configure environment variables for both the backend and frontend. 

### Backend (`/backend/.env`)
Copy the provided `.env.example` to `.env` and fill in the necessary keys:
- Database credentials
- Pinata IPFS API keys
- Blockchain RPC URL (e.g., Alchemy/Infura Sepolia endpoint)
- Private key for the admin wallet handling smart contract transactions
- Hugging Face / AI API keys (if applicable)

### Frontend (`/frontend/.env`)
Create a `.env` file in the frontend directory with your backend API URLs and contract addresses.

## Running the Project

### 1. Smart Contracts (Blockchain)
Navigate to the `Blockchain` directory to compile and deploy the smart contracts.
```bash
cd Blockchain
npm install
npx hardhat compile
# Deploy to local node or testnet as per your hardhat config
```

### 2. Backend Server
Navigate to the `backend` directory, install dependencies, and start the FastAPI server.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Web App
Navigate to the `frontend` directory, install dependencies, and start the Vite development server.
```bash
cd frontend
npm install
npm run dev
```
The web app will be available at `http://localhost:5173`.

## Design System
This project adheres to the "Sovereign Sentinel" design philosophy—a hyper-disciplined, monochromatic aesthetic prioritizing data visibility and high security. Please review `DESIGN.md` in the root directory for specific UI/UX constraints and color tokens before contributing to the frontend.