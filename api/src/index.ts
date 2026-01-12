import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ContractService } from './services/contractService';
import invoiceRoutes from './routes/invoiceRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
const requiredEnvVars = ['CONTRACT_ADDRESS', 'SEPOLIA_RPC_URL', 'PRIVATE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Initialize contract service
const contractService = new ContractService(
  process.env.CONTRACT_ADDRESS!,
  process.env.SEPOLIA_RPC_URL!,
  process.env.PRIVATE_KEY!
);

// Middleware to attach contract service to requests
app.use((req: Request, res: Response, next: NextFunction) => {
  req.contractService = contractService;
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'InvoiceEscrow API is running',
    walletAddress: contractService.getWalletAddress(),
    contractAddress: process.env.CONTRACT_ADDRESS
  });
});

// API routes
app.use('/api/invoices', invoiceRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Contract Address: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`👛 Wallet Address: ${contractService.getWalletAddress()}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/invoices`);
  console.log(`   POST /api/invoices`);
  console.log(`   GET  /api/invoices/:id`);
  console.log(`   GET  /api/invoices/:id/status`);
  console.log(`   POST /api/invoices/:id/fund`);
  console.log(`   POST /api/invoices/:id/complete`);
  console.log(`   POST /api/invoices/:id/release`);
  console.log(`   POST /api/invoices/:id/cancel`);
  console.log(`   POST /api/invoices/:id/resolve-dispute`);
});
