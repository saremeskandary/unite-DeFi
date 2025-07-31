import { NextRequest } from 'next/server';
import { OrderMonitor } from '@/lib/services/order-monitor';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id;
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network') || 'testnet';

  if (!orderId) {
    return new Response(
      JSON.stringify({ error: 'Order ID is required' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const sendEvent = (data: any) => {
        const event = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      // Send connection established
      sendEvent({
        type: 'connected',
        orderId,
        timestamp: new Date().toISOString(),
      });

      // Create order monitor
      const monitor = new OrderMonitor(orderId, network, {
        onStatusUpdate: (status) => {
          sendEvent({
            type: 'status_update',
            orderId,
            status,
            timestamp: new Date().toISOString(),
          });
        },
        onError: (error) => {
          sendEvent({
            type: 'error',
            orderId,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        },
        onComplete: (status) => {
          sendEvent({
            type: 'completed',
            orderId,
            status,
            timestamp: new Date().toISOString(),
          });

          // Close the stream after completion
          setTimeout(() => {
            controller.close();
          }, 1000);
        },
      });

      // Start monitoring
      monitor.startMonitoring().catch((error) => {
        sendEvent({
          type: 'error',
          orderId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        monitor.stopMonitoring();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
} 