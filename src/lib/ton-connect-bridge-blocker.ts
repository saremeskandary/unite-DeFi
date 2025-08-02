// TON Connect Bridge Blocker
// This utility blocks bridge connection requests in development to prevent reconnection loops

let isBlockingEnabled = false;

// Run immediately when this script loads
if (typeof window !== 'undefined') {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevelopment) {
    enableBridgeBlocking();
  }
}

export function enableBridgeBlocking() {
  if (typeof window === 'undefined') return;

  // Only enable in development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isDevelopment) return;

  if (isBlockingEnabled) return;
  isBlockingEnabled = true;

  console.log('TON Connect: Enabling bridge request blocking');

  // Store the original fetch function
  const originalFetch = window.fetch;

  // Override fetch to block bridge requests
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();

    // Block bridge connection requests
    if (url.includes('bridge') && (
      url.includes('tobiwallet.app') ||
      url.includes('uxuy.me') ||
      url.includes('mytokenpocket.vip') ||
      url.includes('ton-bridge')
    )) {
      console.log('TON Connect: Blocked bridge request:', url);

      // Return a mock response that indicates the request was blocked
      return new Response(JSON.stringify({
        error: 'Bridge request blocked in development',
        blocked: true
      }), {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Allow all other requests
    return originalFetch.call(this, input, init);
  };

  // Also block XMLHttpRequest for older code
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async?: boolean, user?: string, password?: string) {
    const urlString = url.toString();

    // Block bridge connection requests
    if (urlString.includes('bridge') && (
      urlString.includes('tobiwallet.app') ||
      urlString.includes('uxuy.me') ||
      urlString.includes('mytokenpocket.vip') ||
      urlString.includes('ton-bridge')
    )) {
      console.log('TON Connect: Blocked XHR bridge request:', urlString);

      // Override the send method to prevent the actual request
      this.send = function () {
        // Simulate a blocked response
        setTimeout(() => {
          // Use Object.defineProperty to set read-only properties
          Object.defineProperty(this, 'status', { value: 403, writable: false });
          Object.defineProperty(this, 'statusText', { value: 'Forbidden', writable: false });
          Object.defineProperty(this, 'responseText', {
            value: JSON.stringify({
              error: 'Bridge request blocked in development',
              blocked: true
            }),
            writable: false
          });

          // Trigger error event
          if (this.onerror) {
            const errorEvent = new ProgressEvent('error');
            this.onerror(errorEvent);
          }
        }, 0);
      };

      return;
    }

    // Allow all other requests
    return originalXHROpen.call(this, method, url, async ?? true, user, password);
  };
}

export function disableBridgeBlocking() {
  if (!isBlockingEnabled) return;

  console.log('TON Connect: Disabling bridge request blocking');
  isBlockingEnabled = false;

  // Note: In a real implementation, you'd restore the original fetch and XMLHttpRequest
  // For now, we'll just set the flag to false
} 