# Ethereum Address Guide

## What is a Valid Ethereum Address?

An Ethereum address is a 42-character string that:
- Starts with `0x`
- Followed by 40 hexadecimal characters (0-9, a-f, A-F)
- Example: `0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58`

## Which Address Should You Use?

For the **freelancer** address in the create invoice endpoint, you can use:

### Option 1: Use Your Own Wallet Address
If you have MetaMask or another wallet:
1. Open your wallet
2. Copy your wallet address
3. Use that address as the freelancer address

### Option 2: Use a Test Address
You can use any valid Ethereum address. Here are some examples:

```
0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
0x1234567890123456789012345678901234567890
```

### Option 3: Generate a New Address
You can generate a new address using:
- MetaMask (create a new account)
- Online tools (for testing only)
- Hardhat/ethers.js

## Common Mistakes

❌ **Wrong:**
- `742d35Cc6634C0532925a3b844Bc9e7595f0bEb` (missing `0x` prefix)
- `0x742d35Cc6634C0532925a3b844Bc9e7595f0bE` (too short - 41 chars)
- `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbb` (too long - 43 chars)
- `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEg` (invalid character 'g')

✅ **Correct:**
- `0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58` (42 characters, valid checksum)

## Example Request

```json
{
  "freelancer": "0x5Bb0e240531Ad8c5F53701adc7D71d2277599E58",
  "amount": "0.1",
  "description": "Web development work"
}
```

## Quick Test

To test if an address is valid, you can use the `/health` endpoint to see your wallet address, or use any address from:
- Your MetaMask wallet
- Sepolia testnet explorer: https://sepolia.etherscan.io
- Any valid Ethereum address

**Note:** The address doesn't need to have any ETH - it just needs to be a valid format. The contract will work with any valid Ethereum address.
