#!/usr/bin/env node

const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Mock data generators
const generateMockPrices = () => {
  const symbols = ['BTC', 'ETH', 'USDC', 'USDT', 'SOL', 'ADA', 'DOT', 'LINK', 'MATIC', 'AVAX'];
  const prices = {};
  
  symbols.forEach(symbol => {
    const basePrice = {
      BTC: 45000,
      ETH: 2800,
      USDC: 1.00,
      USDT: 1.00,
      SOL: 120,
      ADA: 0.45,
      DOT: 7.5,
      LINK: 15,
      MATIC: 0.85,
      AVAX: 35,
    }[symbol];
    
    prices[symbol] = {
      price: basePrice + (Math.random() - 0.5) * basePrice * 0.1,
      change24h: (Math.random() - 0.5) * 20,
      volume24h: basePrice * 1000000 + Math.random() * basePrice * 500000,
      marketCap: basePrice * 10000000 + Math.random() * basePrice * 5000000,
    };
  });
  
  return prices;
};

const generateMockOrderUpdate = (orderId) => {
  const statuses = ['pending', 'processing', 'confirmed', 'failed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    orderId,
    status: randomStatus,
    timestamp: new Date().toISOString(),
    gasUsed: randomStatus === 'confirmed' || randomStatus === 'failed' 
      ? Math.floor(Math.random() * 200000) + 50000 
      : undefined,
    blockNumber: randomStatus === 'confirmed' || randomStatus === 'failed'
      ? Math.floor(Math.random() * 1000000) + 18000000
      : undefined,
    transactionHash: randomStatus === 'confirmed' || randomStatus === 'failed'
      ? `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`
      : undefined,
  };
};

const generateMockPortfolioUpdate = (address) => {
  const assets = [
    { symbol: 'ETH', balance: 15.5 + Math.random() * 5, value: 45000 + Math.random() * 10000, change24h: 2.5 + Math.random() * 8 },
    { symbol: 'BTC', balance: 0.8 + Math.random() * 0.5, value: 36000 + Math.random() * 8000, change24h: -1.2 + Math.random() * 6 },
    { symbol: 'USDC', balance: 25000 + Math.random() * 10000, value: 25000 + Math.random() * 10000, change24h: 0.01 + Math.random() * 0.02 },
    { symbol: 'SOL', balance: 150 + Math.random() * 50, value: 18000 + Math.random() * 5000, change24h: 5.8 + Math.random() * 12 },
  ];
  
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  return {
    totalValue,
    assets,
    timestamp: new Date().toISOString(),
  };
};

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store active subscriptions
const activeSubscriptions = {
  prices: new Set(),
  orders: new Set(),
  portfolios: new Set(),
};

console.log('🚀 Starting WebSocket server...');

// Handle connections
io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  // Handle price subscriptions
  socket.on('subscribe-prices', (symbols) => {
    try {
      if (!Array.isArray(symbols) || symbols.length === 0) {
        socket.emit('error', { message: 'Invalid symbols array' });
        return;
      }

      const limitedSymbols = symbols.slice(0, 10);
      const room = `prices:${limitedSymbols.join(',')}`;
      
      socket.join(room);
      activeSubscriptions.prices.add(room);
      
      // Send initial prices
      const prices = generateMockPrices();
      const filteredPrices = {};
      limitedSymbols.forEach(symbol => {
        if (prices[symbol]) {
          filteredPrices[symbol] = prices[symbol];
        }
      });
      
      socket.emit('price-update', {
        type: 'initial',
        data: filteredPrices,
        timestamp: new Date().toISOString()
      });

      console.log(`💰 Client ${socket.id} subscribed to prices for: ${limitedSymbols.join(', ')}`);
    } catch (error) {
      console.error('Error in price subscription:', error);
      socket.emit('error', { message: 'Failed to subscribe to prices' });
    }
  });

  // Handle order subscriptions
  socket.on('subscribe-orders', (orderId) => {
    if (!orderId) {
      socket.emit('error', { message: 'Order ID is required' });
      return;
    }

    const room = `orders:${orderId}`;
    socket.join(room);
    activeSubscriptions.orders.add(room);
    
    // Send initial order status
    const orderUpdate = generateMockOrderUpdate(orderId);
    socket.emit('order-update', {
      type: 'status',
      data: orderUpdate,
      timestamp: new Date().toISOString()
    });

    console.log(`📋 Client ${socket.id} subscribed to order: ${orderId}`);
  });

  // Handle portfolio subscriptions
  socket.on('subscribe-portfolio', (address) => {
    if (!address) {
      socket.emit('error', { message: 'Address is required' });
      return;
    }

    const room = `portfolio:${address}`;
    socket.join(room);
    activeSubscriptions.portfolios.add(room);
    
    // Send initial portfolio data
    const portfolioUpdate = generateMockPortfolioUpdate(address);
    socket.emit('portfolio-update', {
      type: 'update',
      data: portfolioUpdate,
      timestamp: new Date().toISOString()
    });

    console.log(`💼 Client ${socket.id} subscribed to portfolio: ${address}`);
  });

  // Handle swap quote requests
  socket.on('get-swap-quote', (data) => {
    try {
      const { fromToken, toToken, amount, fromAddress, chainId = 1 } = data;
      
      // Generate mock swap quote
      const quote = {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: (parseFloat(amount) * (0.8 + Math.random() * 0.4)).toFixed(6),
        priceImpact: (Math.random() * 2).toFixed(2),
        gasEstimate: Math.floor(Math.random() * 200000) + 50000,
        route: [
          { protocol: '1inch', name: '1inch' },
          { protocol: 'uniswap', name: 'Uniswap V3' }
        ]
      };

      socket.emit('swap-quote', {
        type: 'quote',
        data: quote,
        timestamp: new Date().toISOString()
      });

      console.log(`💱 Client ${socket.id} requested swap quote: ${fromToken} → ${toToken}`);
    } catch (error) {
      console.error('Error getting swap quote:', error);
      socket.emit('error', { message: 'Failed to get swap quote' });
    }
  });

  // Handle room leaving
  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`🚪 Client ${socket.id} left room: ${room}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`📡 Client disconnected: ${socket.id}`);
  });
});

// Start price updates
setInterval(() => {
  if (activeSubscriptions.prices.size > 0) {
    const prices = generateMockPrices();
    
    activeSubscriptions.prices.forEach(room => {
      const symbols = room.replace('prices:', '').split(',');
      const filteredPrices = {};
      symbols.forEach(symbol => {
        if (prices[symbol]) {
          filteredPrices[symbol] = prices[symbol];
        }
      });
      
      io.to(room).emit('price-update', {
        type: 'update',
        data: filteredPrices,
        timestamp: new Date().toISOString()
      });
    });
  }
}, 30000); // Update every 30 seconds

// Start order updates
setInterval(() => {
  if (activeSubscriptions.orders.size > 0) {
    activeSubscriptions.orders.forEach(room => {
      const orderId = room.replace('orders:', '');
      const orderUpdate = generateMockOrderUpdate(orderId);
      
      io.to(room).emit('order-update', {
        type: 'status',
        data: orderUpdate,
        timestamp: new Date().toISOString()
      });
    });
  }
}, 10000); // Update every 10 seconds

// Start portfolio updates
setInterval(() => {
  if (activeSubscriptions.portfolios.size > 0) {
    activeSubscriptions.portfolios.forEach(room => {
      const address = room.replace('portfolio:', '');
      const portfolioUpdate = generateMockPortfolioUpdate(address);
      
      io.to(room).emit('portfolio-update', {
        type: 'update',
        data: portfolioUpdate,
        timestamp: new Date().toISOString()
      });
    });
  }
}, 60000); // Update every minute

// Start server
const PORT = process.env.WEBSOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ WebSocket server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}`);
  console.log('');
  console.log('📊 Available events:');
  console.log('  • subscribe-prices: Subscribe to price updates');
  console.log('  • subscribe-orders: Subscribe to order updates');
  console.log('  • subscribe-portfolio: Subscribe to portfolio updates');
  console.log('  • get-swap-quote: Request swap quotes');
  console.log('');
  console.log('📡 Emitted events:');
  console.log('  • price-update: Real-time price updates');
  console.log('  • order-update: Real-time order status updates');
  console.log('  • portfolio-update: Real-time portfolio updates');
  console.log('  • swap-quote: Swap quote responses');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  io.close(() => {
    console.log('✅ WebSocket server stopped');
    process.exit(0);
  });
}); 