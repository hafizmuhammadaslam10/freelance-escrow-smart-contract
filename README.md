# Freelance Escrow Smart Contract

A decentralized invoice and payment escrow system built on Ethereum, designed for freelancers and clients to securely manage payments through smart contracts.

## Project Structure

This project consists of two main components:

### 1. Smart Contracts (`hardhat/`)
- **Hardhat** project for developing, testing, and deploying smart contracts
- **InvoiceEscrow.sol**: Main smart contract managing invoices, payments, and escrow functionality
- Uses **OpenZeppelin** contracts for security and best practices
- Supports deployment to Sepolia testnet

### 2. API (`api/`)
- **Node.js/Express** API server for interacting with the smart contract
- **TypeScript** for type safety
- Provides REST endpoints for invoice management
- Uses **ethers.js** for blockchain interactions

## Features

- Create and manage invoices
- Escrow-based payment system
- Secure fund management
- Invoice status tracking (CREATED, FUNDED, COMPLETED, PAID, CANCELLED)
- Owner-controlled contract management

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask or another Ethereum wallet
- Sepolia ETH for testing (get from [Sepolia Faucet](https://sepoliafaucet.com/))

## Installation

### Smart Contracts Setup

```bash
cd hardhat
npm install
```

### API Setup

```bash
cd api
npm install
```

## Configuration

### Hardhat Configuration

1. Create a `.env` file in the `hardhat/` directory:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### API Configuration

1. Create a `.env` file in the `api/` directory:

```env
PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
CONTRACT_ADDRESS=deployed_contract_address_here
PORT=3000
```

## Usage

### Compile Smart Contracts

```bash
cd hardhat
npm run compile
```

### Deploy Smart Contracts

```bash
cd hardhat
npm run deploy
```

This will deploy to the Sepolia testnet. Make sure you have:
- Configured your `.env` file
- Sufficient Sepolia ETH in your wallet

### Run API Server

```bash
cd api
npm run dev
```

The API will start on `http://localhost:3000` (or the port specified in your `.env`).

## API Documentation

See the `api/` directory for:
- `README.md`: API documentation
- `ADDRESS_GUIDE.md`: Contract address management guide
- `WALLET_GUIDE.md`: Wallet setup guide
- `InvoiceEscrow_API.postman_collection.json`: Postman collection for API testing

## Smart Contract Details

### InvoiceEscrow Contract

The contract manages the complete invoice lifecycle:

1. **CREATED**: Invoice is created by freelancer
2. **FUNDED**: Client deposits payment into escrow
3. **COMPLETED**: Freelancer marks work as complete
4. **PAID**: Payment is released to freelancer
5. **CANCELLED**: Invoice is cancelled (refund to client if funded)

### Key Functions

- `createInvoice()`: Create a new invoice
- `fundInvoice()`: Deposit payment into escrow
- `markComplete()`: Mark invoice as completed
- `releasePayment()`: Release payment to freelancer
- `cancelInvoice()`: Cancel an invoice

## Development

### Testing

```bash
cd hardhat
npx hardhat test
```

### Type Checking

```bash
cd api
npm run type-check
```

## Security

- Uses OpenZeppelin's battle-tested contracts
- Follows Solidity best practices
- Comprehensive access control
- Escrow mechanism ensures secure payments

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on the repository.
