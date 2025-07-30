const express = require('express');
const cors = require('cors');
const BitcoinCore = require('bitcoin-core');

const app = express();
const port = process.env.FAUCET_PORT || 3001;

// Bitcoin Core client configuration
const client = new BitcoinCore({
  host: process.env.BITCOIN_RPC_URL?.replace('http://', '').split(':')[0] || 'bitcoin-testnet',
  port: 18332,
  username: process.env.BITCOIN_RPC_USER || 'test',
  password: process.env.BITCOIN_RPC_PASS || 'test',
  network: 'testnet'
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const info = await client.getBlockchainInfo();
    res.json({
      status: 'healthy',
      blockchain: info,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get faucet balance
app.get('/balance', async (req, res) => {
  try {
    const balance = await client.getBalance();
    res.json({
      balance: balance,
      unit: 'BTC'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Send testnet coins to address
app.post('/send', async (req, res) => {
  try {
    const { address, amount = 0.001 } = req.body;
    
    if (!address) {
      return res.status(400).json({
        error: 'Address is required'
      });
    }

    // Validate Bitcoin testnet address
    const addressInfo = await client.validateAddress(address);
    if (!addressInfo.isvalid) {
      return res.status(400).json({
        error: 'Invalid Bitcoin testnet address'
      });
    }

    // Check faucet balance
    const balance = await client.getBalance();
    if (balance < amount) {
      return res.status(400).json({
        error: 'Insufficient faucet balance',
        available: balance,
        requested: amount
      });
    }

    // Send transaction
    const txid = await client.sendToAddress(address, amount);
    
    res.json({
      success: true,
      txid: txid,
      address: address,
      amount: amount,
      message: 'Testnet coins sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Generate new address for faucet
app.post('/generate-address', async (req, res) => {
  try {
    const address = await client.getNewAddress();
    res.json({
      address: address,
      message: 'New faucet address generated'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get transaction info
app.get('/tx/:txid', async (req, res) => {
  try {
    const { txid } = req.params;
    const txInfo = await client.getTransaction(txid);
    res.json(txInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get block info
app.get('/block/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const blockInfo = await client.getBlock(hash);
    res.json(blockInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get latest block
app.get('/latest-block', async (req, res) => {
  try {
    const blockCount = await client.getBlockCount();
    const blockHash = await client.getBlockHash(blockCount);
    const blockInfo = await client.getBlock(blockHash);
    res.json(blockInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Bitcoin testnet faucet running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Faucet balance: http://localhost:${port}/balance`);
}); 