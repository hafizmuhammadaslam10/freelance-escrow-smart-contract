/**
 * Helper script to get wallet information
 * Usage: node scripts/get-wallet-info.js [privateKey]
 * 
 * If you provide a private key, it will show the address.
 * If you don't provide one, it will generate a new wallet.
 */

const { ethers } = require('ethers');

const args = process.argv.slice(2);

if (args.length === 0) {
  // Generate a new wallet
  const wallet = ethers.Wallet.createRandom();
  console.log('\n📝 New Wallet Generated:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Address:    ', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  IMPORTANT: Save this private key securely!');
  console.log('   Never share it or commit it to version control.\n');
} else {
  const input = args[0].trim();
  
  // Check if it's an address
  if (ethers.isAddress(input)) {
    console.log('\n❌ You provided an ADDRESS, not a private key!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Address:', input);
    console.log('Length: ', input.length, 'characters');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('An address is 42 characters (0x + 40 hex)');
    console.log('A private key is 66 characters (0x + 64 hex)\n');
    console.log('To get your private key:');
    console.log('  - MetaMask: Account Details → Show Private Key');
    console.log('  - Or use this script without arguments to generate a new wallet\n');
  } else {
    // Try to use it as a private key
    try {
      const wallet = new ethers.Wallet(input);
      console.log('\n✅ Valid Private Key:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Address:    ', wallet.address);
      console.log('Private Key:', wallet.privateKey);
      console.log('Length:     ', wallet.privateKey.length, 'characters');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      console.log('\n❌ Invalid private key!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Error:', error.message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('A valid private key:');
      console.log('  - Starts with 0x');
      console.log('  - Is exactly 66 characters long');
      console.log('  - Contains only hexadecimal characters (0-9, a-f, A-F)\n');
    }
  }
}
