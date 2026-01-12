import { ethers } from 'ethers';
import { contractABI } from '../config/contractABI';

export interface Invoice {
  invoiceId: bigint;
  client: string;
  freelancer: string;
  amount: bigint;
  description: string;
  status: number; // 0: CREATED, 1: FUNDED, 2: COMPLETED, 3: PAID, 4: CANCELLED
}

export class ContractService {
  private contract: ethers.Contract;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contractAddress: string;
  private rpcUrl: string;
  private defaultPrivateKey: string;

  constructor(
    contractAddress: string,
    rpcUrl: string,
    privateKey: string
  ) {
    this.contractAddress = contractAddress;
    this.rpcUrl = rpcUrl;
    this.defaultPrivateKey = privateKey;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
  }

  /**
   * Get a contract instance with a specific wallet
   */
  private getContractWithWallet(privateKey?: string): ethers.Contract {
    if (!privateKey) {
      return this.contract;
    }
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(this.contractAddress, contractABI, wallet);
  }

  /**
   * Create a new invoice
   * @param freelancer The freelancer address
   * @param amount The amount in ETH (as string)
   * @param description The invoice description
   * @param privateKey Optional private key of the client wallet
   */
  async createInvoice(
    freelancer: string,
    amount: string, // in ETH
    description: string,
    privateKey?: string
  ): Promise<{ invoiceId: bigint; txHash: string }> {
    try {
      const contract = this.getContractWithWallet(privateKey);
      const amountWei = ethers.parseEther(amount);
      const tx = await contract.createInvoice(freelancer, amountWei, description);
      const receipt = await tx.wait();
      
      // Get invoiceId from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'InvoiceCreated';
        } catch {
          return false;
        }
      });

      let invoiceId: bigint;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        invoiceId = parsed?.args[0] as bigint;
      } else {
        // Fallback: get total invoices - 1
        const total = await contract.getTotalInvoices();
        invoiceId = total - 1n;
      }

      return {
        invoiceId,
        txHash: receipt.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Fund an invoice
   * @param invoiceId The invoice ID
   * @param privateKey Optional private key of the client wallet (must match the client address)
   */
  async fundInvoice(invoiceId: number, privateKey?: string): Promise<{ txHash: string }> {
    try {
      const contract = this.getContractWithWallet(privateKey);
      // First get the invoice to know the amount
      const invoice = await contract.getInvoice(invoiceId);
      const amount = invoice.amount;

      const tx = await contract.fundInvoice(invoiceId, { value: amount });
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to fund invoice: ${error.message}`);
    }
  }

  /**
   * Mark invoice as completed
   * @param invoiceId The invoice ID
   * @param privateKey Optional private key of the freelancer wallet (must match the freelancer address)
   */
  async markInvoiceCompleted(invoiceId: number, privateKey?: string): Promise<{ txHash: string }> {
    try {
      const contract = this.getContractWithWallet(privateKey);
      const tx = await contract.markInvoiceCompleted(invoiceId);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to mark invoice as completed: ${error.message}`);
    }
  }

  /**
   * Release payment to freelancer
   * @param invoiceId The invoice ID
   * @param privateKey Optional private key of the client wallet (must match the client address)
   */
  async releasePayment(invoiceId: number, privateKey?: string): Promise<{ txHash: string }> {
    try {
      const contract = this.getContractWithWallet(privateKey);
      const tx = await contract.releasePayment(invoiceId);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to release payment: ${error.message}`);
    }
  }

  /**
   * Cancel an invoice
   * @param invoiceId The invoice ID
   * @param privateKey Optional private key of the client wallet (must match the client address)
   */
  async cancelInvoice(invoiceId: number, privateKey?: string): Promise<{ txHash: string }> {
    try {
      const contract = this.getContractWithWallet(privateKey);
      const tx = await contract.cancelInvoice(invoiceId);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to cancel invoice: ${error.message}`);
    }
  }

  /**
   * Resolve dispute (admin only)
   */
  async resolveDispute(
    invoiceId: number,
    releaseToFreelancer: boolean
  ): Promise<{ txHash: string }> {
    try {
      const tx = await this.contract.resolveDispute(invoiceId, releaseToFreelancer);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash
      };
    } catch (error: any) {
      throw new Error(`Failed to resolve dispute: ${error.message}`);
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: number): Promise<Invoice> {
    try {
      const invoice = await this.contract.getInvoice(invoiceId);
      return {
        invoiceId: invoice.invoiceId,
        client: invoice.client,
        freelancer: invoice.freelancer,
        amount: invoice.amount,
        description: invoice.description,
        status: Number(invoice.status)
      };
    } catch (error: any) {
      throw new Error(`Failed to get invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(invoiceId: number): Promise<number> {
    try {
      const status = await this.contract.getInvoiceStatus(invoiceId);
      return Number(status);
    } catch (error: any) {
      throw new Error(`Failed to get invoice status: ${error.message}`);
    }
  }

  /**
   * Get total number of invoices
   */
  async getTotalInvoices(): Promise<bigint> {
    try {
      return await this.contract.getTotalInvoices();
    } catch (error: any) {
      throw new Error(`Failed to get total invoices: ${error.message}`);
    }
  }

  /**
   * Get contract owner
   */
  async getOwner(): Promise<string> {
    try {
      return await this.contract.owner();
    } catch (error: any) {
      throw new Error(`Failed to get owner: ${error.message}`);
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }
}
