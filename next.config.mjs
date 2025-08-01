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
  // Add timeout configurations
  experimental: {
    // Remove ethers from serverExternalPackages to fix the error
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