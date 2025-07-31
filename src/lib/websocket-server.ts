import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { priceOracle } from './price-oracle';
import { blockchainIntegration } from './blockchain-integration';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private orderUpdateInterval: NodeJS.Timeout | null = null;

  constructor() { }

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    this.startPriceUpdates();
    this.startOrderUpdates();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle price subscription
      socket.on('subscribe-prices', async (symbols: string[]) => {
        try {
          if (!Array.isArray(symbols) || symbols.length === 0) {
            socket.emit('error', { message: 'Invalid symbols array' });
            return;
          }

          // Limit to 10 symbols per subscription
          const limitedSymbols = symbols.slice(0, 10);

          // Join price room
          socket.join(`prices:${limitedSymbols.join(',')}`);

          // Send initial prices
          const prices = await priceOracle.getMultipleTokenPrices(limitedSymbols);
          socket.emit('price-update', {
            type: 'initial',
            data: Object.fromEntries(prices),
            timestamp: new Date().toISOString()
          });

          console.log(`Client ${socket.id} subscribed to prices for: ${limitedSymbols.join(', ')}`);
        } catch (error) {
          console.error('Error in price subscription:', error);
          socket.emit('error', { message: 'Failed to subscribe to prices' });
        }
      });

      // Handle order subscription
      socket.on('subscribe-orders', (orderId: string) => {
        if (!orderId) {
          socket.emit('error', { message: 'Order ID is required' });
          return;
        }

        socket.join(`orders:${orderId}`);
        console.log(`Client ${socket.id} subscribed to order: ${orderId}`);
      });

      // Handle swap quote request
      socket.on('get-swap-quote', async (data: {
        fromToken: string;
        toToken: string;
        amount: string;
        fromAddress: string;
        chainId?: number;
      }) => {
        try {
          const quote = await priceOracle.getSwapQuote(
            data.fromToken,
            data.toToken,
            data.amount,
            data.fromAddress,
            data.chainId || 1
          );

          if (quote) {
            socket.emit('swap-quote', {
              type: 'quote',
              data: quote,
              timestamp: new Date().toISOString()
            });
          } else {
            socket.emit('error', { message: 'Failed to get swap quote' });
          }
        } catch (error) {
          console.error('Error getting swap quote:', error);
          socket.emit('error', { message: 'Failed to get swap quote' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async startPriceUpdates() {
    if (!this.io) return;

    // Update prices every 30 seconds
    this.priceUpdateInterval = setInterval(async () => {
      try {
        // Get all active price subscriptions
        const rooms = this.io.sockets.adapter.rooms;
        const priceRooms = Array.from(rooms.keys()).filter(room => room.startsWith('prices:'));

        for (const room of priceRooms) {
          const symbols = room.replace('prices:', '').split(',');
          const prices = await priceOracle.getMultipleTokenPrices(symbols);

          this.io.to(room).emit('price-update', {
            type: 'update',
            data: Object.fromEntries(prices),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating prices:', error);
      }
    }, 30000); // 30 seconds
  }

  private startOrderUpdates() {
    if (!this.io) return;

    // Simulate order updates every 10 seconds
    this.orderUpdateInterval = setInterval(async () => {
      try {
        const rooms = this.io.sockets.adapter.rooms;
        const orderRooms = Array.from(rooms.keys()).filter(room => room.startsWith('orders:'));

        for (const room of orderRooms) {
          const orderId = room.replace('orders:', '');

          // Simulate order status updates
          const mockUpdate = {
            orderId,
            status: this.getRandomStatus(),
            timestamp: new Date().toISOString(),
            gasUsed: Math.floor(Math.random() * 100000) + 50000,
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000
          };

          this.io.to(room).emit('order-update', {
            type: 'status',
            data: mockUpdate,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error updating orders:', error);
      }
    }, 10000); // 10 seconds
  }

  private getRandomStatus(): string {
    const statuses = ['pending', 'processing', 'confirmed', 'failed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  // Public methods for broadcasting updates
  public broadcastPriceUpdate(symbols: string[], prices: Map<string, any>) {
    if (!this.io) return;

    const room = `prices:${symbols.join(',')}`;
    this.io.to(room).emit('price-update', {
      type: 'update',
      data: Object.fromEntries(prices),
      timestamp: new Date().toISOString()
    });
  }

  public broadcastOrderUpdate(orderId: string, update: any) {
    if (!this.io) return;

    const room = `orders:${orderId}`;
    this.io.to(room).emit('order-update', {
      type: 'status',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastSwapExecution(orderId: string, result: any) {
    if (!this.io) return;

    this.io.emit('swap-executed', {
      type: 'execution',
      data: { orderId, ...result },
      timestamp: new Date().toISOString()
    });
  }

  public cleanup() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    if (this.orderUpdateInterval) {
      clearInterval(this.orderUpdateInterval);
    }
    if (this.io) {
      this.io.close();
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService(); 