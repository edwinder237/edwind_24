/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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


