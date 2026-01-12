# InvoiceEscrow API

REST API for interacting with the InvoiceEscrow smart contract. This API provides endpoints for all contract functions and can be tested using Postman.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `api` directory with the following variables:

```env
# Contract Configuration
CONTRACT_ADDRESS=0x3E8e88Ca4a43a25fDf29ba02D26b1A3E3fC6f1bD

# RPC URL (Sepolia testnet example)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# Or use Alchemy: https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
# Or use public RPC: https://rpc.sepolia.org

# Private Key (without 0x prefix)
# IMPORTANT: Never commit this to version control!
# This should be the private key of the wallet that will sign transactions
PRIVATE_KEY=your_private_key_here

# Server Configuration
PORT=3000
```

### 3. Run the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Check API status and configuration

### Invoice Management

#### Create Invoice
- **POST** `/api/invoices`
- **Body:**
  ```json
   {
     "freelancer": "0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58",
     "amount": "0.1",
     "description": "Web development work"
   }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Invoice created successfully",
    "data": {
      "invoiceId": "0",
      "txHash": "0x..."
    }
  }
  ```

#### Fund Invoice
- **POST** `/api/invoices/:id/fund`
- **Description:** Funds an invoice with ETH. The amount is automatically taken from the invoice details.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Invoice funded successfully",
    "data": {
      "txHash": "0x..."
    }
  }
  ```

#### Mark Invoice as Completed
- **POST** `/api/invoices/:id/complete`
- **Description:** Freelancer marks the invoice as completed.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Invoice marked as completed",
    "data": {
      "txHash": "0x..."
    }
  }
  ```

#### Release Payment
- **POST** `/api/invoices/:id/release`
- **Description:** Client releases payment to freelancer.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Payment released successfully",
    "data": {
      "txHash": "0x..."
    }
  }
  ```

#### Cancel Invoice
- **POST** `/api/invoices/:id/cancel`
- **Description:** Client cancels an invoice (only if in CREATED status).
- **Response:**
  ```json
  {
    "success": true,
    "message": "Invoice cancelled successfully",
    "data": {
      "txHash": "0x..."
    }
  }
  ```

#### Resolve Dispute (Admin Only)
- **POST** `/api/invoices/:id/resolve-dispute`
- **Body:**
  ```json
  {
    "releaseToFreelancer": true
  }
  ```
- **Description:** Contract owner resolves a dispute. If `releaseToFreelancer` is `true`, payment is released to freelancer. If `false`, refund is sent to client.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Dispute resolved successfully",
    "data": {
      "txHash": "0x...",
      "action": "release"
    }
  }
  ```

### Invoice Queries

#### Get Total Invoices
- **GET** `/api/invoices`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalInvoices": "5"
    }
  }
  ```

#### Get Invoice Details
- **GET** `/api/invoices/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "invoiceId": "0",
      "client": "0x...",
      "freelancer": "0x...",
      "amount": "100000000000000000",
      "amountEth": "0.1",
      "description": "Web development work",
      "status": 1,
      "statusName": "FUNDED"
    }
  }
  ```

#### Get Invoice Status
- **GET** `/api/invoices/:id/status`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "status": 1,
      "statusName": "FUNDED"
    }
  }
  ```

## Invoice Status Values

- `0` - CREATED: Invoice created but not yet funded
- `1` - FUNDED: Client has deposited ETH into escrow
- `2` - COMPLETED: Freelancer has marked work as complete
- `3` - PAID: Payment has been released to freelancer
- `4` - CANCELLED: Invoice has been cancelled

## Postman Collection

You can import the following endpoints into Postman:

1. **Base URL:** `http://localhost:3000`

2. **Create Invoice**
   - Method: POST
   - URL: `http://localhost:3000/api/invoices`
   - Body (JSON):
     ```json
   {
     "freelancer": "0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58",
     "amount": "0.1",
     "description": "Web development work"
   }
     ```

3. **Fund Invoice**
   - Method: POST
   - URL: `http://localhost:3000/api/invoices/0/fund`

4. **Mark Complete**
   - Method: POST
   - URL: `http://localhost:3000/api/invoices/0/complete`

5. **Release Payment**
   - Method: POST
   - URL: `http://localhost:3000/api/invoices/0/release`

6. **Cancel Invoice**
   - Method: POST
   - URL: `http://localhost:3000/api/invoices/0/cancel`

7. **Resolve Dispute**
   - Method: POST
   - URL: `http://localhost:3000/api/invoices/0/resolve-dispute`
   - Body (JSON):
     ```json
     {
       "releaseToFreelancer": true
     }
     ```

8. **Get Invoice**
   - Method: GET
   - URL: `http://localhost:3000/api/invoices/0`

9. **Get Invoice Status**
   - Method: GET
   - URL: `http://localhost:3000/api/invoices/0/status`

10. **Get Total Invoices**
    - Method: GET
    - URL: `http://localhost:3000/api/invoices`

## Important Notes

1. **Private Key Security:** Never commit your private key to version control. Use environment variables.

2. **Gas Fees:** All write operations (create, fund, complete, release, cancel, resolve) require gas fees. Make sure the wallet has sufficient ETH.

3. **Transaction Signing:** All transactions are signed using the private key provided in the `.env` file. The wallet address will be shown in the `/health` endpoint.

4. **Network:** Make sure your RPC URL matches the network where your contract is deployed (Sepolia in this case).

5. **Amount Format:** When creating invoices, use ETH amounts as strings (e.g., "0.1" for 0.1 ETH). The API automatically converts to wei.

6. **Error Handling:** All endpoints return appropriate error messages if something goes wrong. Check the error field in the response.

## Troubleshooting

- **"Missing required environment variables"**: Make sure your `.env` file is properly configured.
- **"Failed to create invoice"**: Check that the wallet has sufficient ETH for gas fees.
- **"Invalid freelancer address"**: Ensure the address is a valid Ethereum address.
- **Transaction failures**: Check the error message in the response for specific contract revert reasons.
