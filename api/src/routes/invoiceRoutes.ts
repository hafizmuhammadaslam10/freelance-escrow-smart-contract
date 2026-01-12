import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import { ContractService } from '../services/contractService';

const router = Router();

// Initialize contract service (will be set by middleware)
declare global {
  namespace Express {
    interface Request {
      contractService: ContractService;
    }
  }
}

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice
 * @access  Public
 * @body    { freelancer: string, amount: string (in ETH), description: string }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { freelancer, amount, description } = req.body;

    if (!freelancer || !amount || !description) {
      return res.status(400).json({
        error: 'Missing required fields: freelancer, amount, description'
      });
    }

    // Validate and normalize address
    // Trim whitespace that might come from copy-paste
    const trimmedAddress = freelancer.trim();
    
    if (!ethers.isAddress(trimmedAddress)) {
      return res.status(400).json({
        error: 'Invalid freelancer address',
        message: 'The freelancer address must be a valid Ethereum address (42 characters: 0x + 40 hex characters)',
        received: trimmedAddress,
        receivedLength: trimmedAddress.length,
        example: '0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58'
      });
    }

    // Normalize address to checksum format
    const normalizedAddress = ethers.getAddress(trimmedAddress);

    const result = await req.contractService.createInvoice(normalizedAddress, amount, description);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceId: result.invoiceId.toString(),
        txHash: result.txHash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to create invoice'
    });
  }
});

/**
 * @route   POST /api/invoices/:id/fund
 * @desc    Fund an invoice
 * @access  Public
 * @body    { privateKey?: string } - Optional: Private key of the client wallet (must match the client address in the invoice)
 */
router.post('/:id/fund', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { privateKey } = req.body;

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    // If privateKey is provided, validate it
    if (privateKey) {
      // Check if user mistakenly provided an address instead of private key
      if (ethers.isAddress(privateKey)) {
        return res.status(400).json({
          error: 'You provided an address instead of a private key',
          message: 'A private key is 66 characters (0x + 64 hex), not an address (42 characters)',
          received: privateKey,
          receivedLength: privateKey.length,
          help: 'To get your private key: MetaMask → Account Details → Show Private Key'
        });
      }

      try {
        const wallet = new ethers.Wallet(privateKey);
        // Get invoice to verify the wallet matches client
        const invoice = await req.contractService.getInvoice(invoiceId);
        if (wallet.address.toLowerCase() !== invoice.client.toLowerCase()) {
          return res.status(400).json({
            error: 'Private key does not match the client address',
            expected: invoice.client,
            provided: wallet.address
          });
        }
      } catch (error: any) {
        return res.status(400).json({
          error: 'Invalid private key',
          message: error.message,
          help: 'A private key should be 66 characters: 0x followed by 64 hexadecimal characters'
        });
      }
    }

    const result = await req.contractService.fundInvoice(invoiceId, privateKey);

    res.json({
      success: true,
      message: 'Invoice funded successfully',
      data: {
        txHash: result.txHash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fund invoice'
    });
  }
});

/**
 * @route   POST /api/invoices/:id/complete
 * @desc    Mark invoice as completed
 * @access  Public
 * @body    { privateKey?: string } - Optional: Private key of the freelancer wallet (must match the freelancer address in the invoice)
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { privateKey } = req.body;

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    // If privateKey is provided, validate it
    if (privateKey) {
      // Check if user mistakenly provided an address instead of private key
      if (ethers.isAddress(privateKey)) {
        return res.status(400).json({
          error: 'You provided an address instead of a private key',
          message: 'A private key is 66 characters (0x + 64 hex), not an address (42 characters)',
          received: privateKey,
          receivedLength: privateKey.length,
          help: 'To get your private key: MetaMask → Account Details → Show Private Key'
        });
      }

      try {
        const wallet = new ethers.Wallet(privateKey);
        // Get invoice to verify the wallet matches freelancer
        const invoice = await req.contractService.getInvoice(invoiceId);
        if (wallet.address.toLowerCase() !== invoice.freelancer.toLowerCase()) {
          return res.status(400).json({
            error: 'Private key does not match the freelancer address',
            expected: invoice.freelancer,
            provided: wallet.address
          });
        }
      } catch (error: any) {
        return res.status(400).json({
          error: 'Invalid private key',
          message: error.message,
          help: 'A private key should be 66 characters: 0x followed by 64 hexadecimal characters'
        });
      }
    }

    const result = await req.contractService.markInvoiceCompleted(invoiceId, privateKey);

    res.json({
      success: true,
      message: 'Invoice marked as completed',
      data: {
        txHash: result.txHash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to mark invoice as completed'
    });
  }
});

/**
 * @route   POST /api/invoices/:id/release
 * @desc    Release payment to freelancer
 * @access  Public
 * @body    { privateKey?: string } - Optional: Private key of the client wallet (must match the client address in the invoice)
 */
router.post('/:id/release', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { privateKey } = req.body;

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    // If privateKey is provided, validate it
    if (privateKey) {
      // Check if user mistakenly provided an address instead of private key
      if (ethers.isAddress(privateKey)) {
        return res.status(400).json({
          error: 'You provided an address instead of a private key',
          message: 'A private key is 66 characters (0x + 64 hex), not an address (42 characters)',
          received: privateKey,
          receivedLength: privateKey.length,
          help: 'To get your private key: MetaMask → Account Details → Show Private Key'
        });
      }

      try {
        const wallet = new ethers.Wallet(privateKey);
        // Get invoice to verify the wallet matches client
        const invoice = await req.contractService.getInvoice(invoiceId);
        if (wallet.address.toLowerCase() !== invoice.client.toLowerCase()) {
          return res.status(400).json({
            error: 'Private key does not match the client address',
            expected: invoice.client,
            provided: wallet.address
          });
        }
      } catch (error: any) {
        return res.status(400).json({
          error: 'Invalid private key',
          message: error.message,
          help: 'A private key should be 66 characters: 0x followed by 64 hexadecimal characters'
        });
      }
    }

    const result = await req.contractService.releasePayment(invoiceId, privateKey);

    res.json({
      success: true,
      message: 'Payment released successfully',
      data: {
        txHash: result.txHash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to release payment'
    });
  }
});

/**
 * @route   POST /api/invoices/:id/cancel
 * @desc    Cancel an invoice
 * @access  Public
 * @body    { privateKey?: string } - Optional: Private key of the client wallet (must match the client address in the invoice)
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { privateKey } = req.body;

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    // If privateKey is provided, validate it
    if (privateKey) {
      // Check if user mistakenly provided an address instead of private key
      if (ethers.isAddress(privateKey)) {
        return res.status(400).json({
          error: 'You provided an address instead of a private key',
          message: 'A private key is 66 characters (0x + 64 hex), not an address (42 characters)',
          received: privateKey,
          receivedLength: privateKey.length,
          help: 'To get your private key: MetaMask → Account Details → Show Private Key'
        });
      }

      try {
        const wallet = new ethers.Wallet(privateKey);
        // Get invoice to verify the wallet matches client
        const invoice = await req.contractService.getInvoice(invoiceId);
        if (wallet.address.toLowerCase() !== invoice.client.toLowerCase()) {
          return res.status(400).json({
            error: 'Private key does not match the client address',
            expected: invoice.client,
            provided: wallet.address
          });
        }
      } catch (error: any) {
        return res.status(400).json({
          error: 'Invalid private key',
          message: error.message,
          help: 'A private key should be 66 characters: 0x followed by 64 hexadecimal characters'
        });
      }
    }

    const result = await req.contractService.cancelInvoice(invoiceId, privateKey);

    res.json({
      success: true,
      message: 'Invoice cancelled successfully',
      data: {
        txHash: result.txHash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to cancel invoice'
    });
  }
});

/**
 * @route   POST /api/invoices/:id/resolve-dispute
 * @desc    Resolve dispute (admin only)
 * @access  Public
 * @body    { releaseToFreelancer: boolean }
 */
router.post('/:id/resolve-dispute', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { releaseToFreelancer } = req.body;

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    if (typeof releaseToFreelancer !== 'boolean') {
      return res.status(400).json({
        error: 'releaseToFreelancer must be a boolean'
      });
    }

    const result = await req.contractService.resolveDispute(invoiceId, releaseToFreelancer);

    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      data: {
        txHash: result.txHash,
        action: releaseToFreelancer ? 'release' : 'refund'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to resolve dispute'
    });
  }
});

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice details
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    const invoice = await req.contractService.getInvoice(invoiceId);

    const statusNames = ['CREATED', 'FUNDED', 'COMPLETED', 'PAID', 'CANCELLED'];

    res.json({
      success: true,
      data: {
        invoiceId: invoice.invoiceId.toString(),
        client: invoice.client,
        freelancer: invoice.freelancer,
        amount: invoice.amount.toString(),
        amountEth: ethers.formatEther(invoice.amount),
        description: invoice.description,
        status: invoice.status,
        statusName: statusNames[invoice.status] || 'UNKNOWN'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to get invoice'
    });
  }
});

/**
 * @route   GET /api/invoices/:id/status
 * @desc    Get invoice status
 * @access  Public
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID'
      });
    }

    const status = await req.contractService.getInvoiceStatus(invoiceId);
    const statusNames = ['CREATED', 'FUNDED', 'COMPLETED', 'PAID', 'CANCELLED'];

    res.json({
      success: true,
      data: {
        status,
        statusName: statusNames[status] || 'UNKNOWN'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to get invoice status'
    });
  }
});

/**
 * @route   GET /api/invoices
 * @desc    Get total number of invoices
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const total = await req.contractService.getTotalInvoices();

    res.json({
      success: true,
      data: {
        totalInvoices: total.toString()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to get total invoices'
    });
  }
});

/**
 * @route   POST /api/invoices/check-wallet
 * @desc    Check which address a private key belongs to (helper endpoint)
 * @access  Public
 * @body    { privateKey: string }
 */
router.post('/check-wallet', async (req: Request, res: Response) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        error: 'Missing privateKey in request body'
      });
    }

    // Check if user mistakenly provided an address
    if (ethers.isAddress(privateKey)) {
      return res.status(400).json({
        error: 'You provided an address, not a private key',
        received: privateKey,
        help: 'A private key is 66 characters (0x + 64 hex), not an address (42 characters)'
      });
    }

    try {
      const wallet = new ethers.Wallet(privateKey);
      res.json({
        success: true,
        data: {
          address: wallet.address,
          message: 'This private key belongs to the address above'
        }
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Invalid private key',
        message: error.message
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to check wallet'
    });
  }
});

export default router;
