/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix the conflict between transpilePackages and serverExternalPackages
  experimental: {
    serverExternalPackages: ['@tonconnect/ui-react'],
  },
  // Add CORS headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Increase timeout for development
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { isServer }) => {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      // Add timeout configurations for development
      if (!isServer) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
        };
      }

      // Fix ethers package resolution
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };



      return config;
    },
  }),
  // Production webpack config
  ...(process.env.NODE_ENV !== 'development' && {
    webpack: (config, { isServer }) => {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      // Fix ethers package resolution for production
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };

      return config;
    },
  }),
}

export default nextConfig