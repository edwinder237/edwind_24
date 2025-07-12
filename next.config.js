/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@babel/preset-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
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
    // redirect - default first page should be `/projects` when root URL like http://example.com/
    return [
      {
        source: '/',
        destination: '/projects',
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;


