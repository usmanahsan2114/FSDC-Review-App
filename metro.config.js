const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable tree shaking and advanced minification
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  compress: {
    drop_console: true, // Remove console.log statements in production
    drop_debugger: true, // Remove debugger statements
    pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
  },
};

// Optimize bundle size and performance
config.resolver.platforms = ['native', 'android', 'ios'];

// Enable advanced optimizations
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Enable experimental optimizations for smaller bundles
config.transformer.experimentalImportSupport = true;

module.exports = config;