/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  // Suppress HMR invalid message warnings for ISR manifests in development
  experimental: {
    isrFlushToDisk: false,
    // Disable ISR manifest during development to avoid HMR warnings
    isrMemoryCacheSize: 0,
  },
  // Keep Prisma external to prevent HMR connection issues
  serverExternalPackages: ['@prisma/client', 'prisma'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '0',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://flagcdn.com https://images.unsplash.com https://i.ibb.co https://maps.googleapis.com https://lh3.googleusercontent.com https://places.googleapis.com https://pub-34f9e757e51b451ea7060249e757957c.r2.dev https://i.pravatar.cc https://d1oco4z2z1fhwp.cloudfront.net https://d15k2d11r6t6rl.cloudfront.net",
              "connect-src 'self'",
              "frame-src 'self' https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
    ],
  },
  env: {
    REACT_APP_VERSION: process.env.REACT_APP_VERSION,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  webpack: (config, { isServer, webpack }) => {
    // Exclude WorkOS node package from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@workos-inc/node': 'commonjs @workos-inc/node'
      });
      
      // Remove any preact aliases that might interfere with FullCalendar
      if (config.resolve.alias) {
        delete config.resolve.alias['preact'];
        delete config.resolve.alias['preact/compat'];
      }
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        "node:crypto": false,
        "node:fs": false,
        "node:http": false,
        "node:https": false,
        "node:net": false,
        "node:path": false,
        "node:stream": false,
        "node:url": false,
        "node:util": false,
        "node:zlib": false,
      };

      // Ignore node: protocol imports in client bundle
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^node:/
        })
      );
    }
    return config;
  },
  async redirects() {
    return [];
  }
};

module.exports = nextConfig;


