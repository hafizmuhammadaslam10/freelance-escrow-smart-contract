# Wallet Guide for InvoiceEscrow API

## Understanding Wallet Requirements

The InvoiceEscrow contract has specific requirements for who can perform each action:

- **Client wallet** can: create, fund, cancel, release payment
- **Freelancer wallet** can: mark invoice as completed
- **Contract owner** can: resolve disputes

## The Problem

If you're using a single wallet (from `PRIVATE_KEY` in `.env`) for all operations, you'll get errors like:
```
"only freelancer can mark as completed"
"only client can fund invoice"
```

## Solution: Use Optional Private Key in Requests

The API now supports passing an optional `privateKey` in the request body for operations that require a specific wallet.

## How to Use

### Step 1: Get the Invoice Details

First, check who the client and freelancer are:

```bash
GET http://localhost:3000/api/invoices/0
```

Response:
```json
{
  "success": true,
  "data": {
    "invoiceId": "0",
    "client": "0xClientAddress...",
    "freelancer": "0xFreelancerAddress...",
    ...
  }
}
```

### Step 2: Use the Correct Private Key

#### For Marking Invoice as Completed (Freelancer Action)

```bash
POST http://localhost:3000/api/invoices/0/complete
Content-Type: application/json

{
  "privateKey": "0x...your_freelancer_private_key..."
}
```

#### For Funding Invoice (Client Action)

```bash
POST http://localhost:3000/api/invoices/0/fund
Content-Type: application/json

{
  "privateKey": "0x...your_client_private_key..."
}
```

#### For Releasing Payment (Client Action)

```bash
POST http://localhost:3000/api/invoices/0/release
Content-Type: application/json

{
  "privateKey": "0x...your_client_private_key..."
}
```

#### For Cancelling Invoice (Client Action)

```bash
POST http://localhost:3000/api/invoices/0/cancel
Content-Type: application/json

{
  "privateKey": "0x...your_client_private_key..."
}
```

## Important Notes

1. **Private Key Security**: Never commit private keys to version control. Only use them in requests during testing.

2. **Validation**: The API automatically validates that the private key matches the required address:
   - For `complete`: Must match the freelancer address
   - For `fund`, `release`, `cancel`: Must match the client address

3. **Fallback**: If you don't provide a `privateKey`, the API will use the default wallet from `PRIVATE_KEY` in your `.env` file. This only works if that wallet is the correct one for the operation.

4. **Getting Private Keys**:
   - From MetaMask: Account Details → Show Private Key
   - From Hardhat: Use the accounts from your Hardhat config
   - **Never share your private keys!**

## Example Workflow

1. **Create Invoice** (uses default wallet or client's private key):
   ```json
   POST /api/invoices
   {
     "freelancer": "0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58",
     "amount": "0.1",
     "description": "Web development"
   }
   ```

2. **Fund Invoice** (use client's private key):
   ```json
   POST /api/invoices/0/fund
   {
     "privateKey": "0x...client_private_key..."
   }
   ```

3. **Mark as Completed** (use freelancer's private key):
   ```json
   POST /api/invoices/0/complete
   {
     "privateKey": "0x...freelancer_private_key..."
   }
   ```

4. **Release Payment** (use client's private key):
   ```json
   POST /api/invoices/0/release
   {
     "privateKey": "0x...client_private_key..."
   }
   ```

## Troubleshooting

**Error: "Private key does not match the freelancer address"**
- Make sure you're using the freelancer's private key, not the client's

**Error: "Private key does not match the client address"**
- Make sure you're using the client's private key, not the freelancer's

**Error: "Invalid private key"**
- Check that the private key is valid (starts with 0x, 66 characters total)
- Make sure there are no extra spaces or newlines

## Security Warning

⚠️ **Never expose private keys in production!** This feature is intended for testing and development. In production, consider:
- Using wallet signing on the client side
- Implementing proper authentication
- Using secure key management services
