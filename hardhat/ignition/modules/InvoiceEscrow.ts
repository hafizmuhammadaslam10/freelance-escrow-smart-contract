import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition module for deploying the InvoiceEscrow contract
 * 
 * This module deploys the InvoiceEscrow contract with a configurable initial owner.
 * By default, it uses the deployer's address as the initial owner.
 * 
 * To deploy with a custom owner address:
 * npx hardhat ignition deploy ignition/modules/InvoiceEscrow.ts --parameters '{"InvoiceEscrowModule":{"initialOwner":"0x..."}}'
 */
const InvoiceEscrowModule = buildModule("InvoiceEscrowModule", (m) => {
  // Get the initial owner parameter, defaulting to the first account (deployer)
  const initialOwner = m.getParameter("initialOwner", m.getAccount(0));

  // Deploy the InvoiceEscrow contract
  const invoiceEscrow = m.contract("InvoiceEscrow", [initialOwner]);

  // Return the deployed contract for external access
  return { invoiceEscrow };
});

export default InvoiceEscrowModule;
