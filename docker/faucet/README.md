# Bitcoin Testnet Faucet

A simple faucet service for providing Bitcoin testnet coins during local development and testing.

## Features

- **Health Check**: Monitor Bitcoin node status
- **Balance Check**: Check faucet balance
- **Send Coins**: Send testnet coins to addresses
- **Address Generation**: Generate new faucet addresses
- **Transaction Info**: Get transaction details
- **Block Info**: Get block information

## API Endpoints

### Health Check
```bash
GET /health
```

### Get Faucet Balance
```bash
GET /balance
```

### Send Testnet Coins
```bash
POST /send
Content-Type: application/json

{
  "address": "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "amount": 0.001
}
```

### Generate New Address
```bash
POST /generate-address
```

### Get Transaction Info
```bash
GET /tx/{txid}
```

### Get Block Info
```bash
GET /block/{hash}
```

### Get Latest Block
```bash
GET /latest-block
```

## Usage Examples

### Using curl

```bash
# Check health
curl http://localhost:3001/health

# Get balance
curl http://localhost:3001/balance

# Send coins
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"address": "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "amount": 0.001}'

# Generate address
curl -X POST http://localhost:3001/generate-address
```

### Using JavaScript

```javascript
// Send testnet coins
const response = await fetch('http://localhost:3001/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: 0.001
  })
});

const result = await response.json();
console.log('Transaction ID:', result.txid);
```

## Environment Variables

- `BITCOIN_RPC_URL`: Bitcoin node RPC URL (default: `bitcoin-testnet`)
- `BITCOIN_RPC_USER`: RPC username (default: `test`)
- `BITCOIN_RPC_PASS`: RPC password (default: `test`)
- `FAUCET_PORT`: Faucet service port (default: `3001`)

## Notes

- This faucet only works with Bitcoin testnet addresses
- The faucet requires a running Bitcoin testnet node
- Coins sent are testnet coins with no real value
- Use responsibly for development and testing only 