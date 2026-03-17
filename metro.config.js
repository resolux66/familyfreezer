const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Several packages (zustand, appwrite) ship ESM builds with import.meta which
// Metro cannot handle. Force resolution to react-native/require/CJS builds.
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

// Appwrite has no react-native condition; the resolveRequest intercept points
// Metro directly at the CJS file, bypassing the package exports map entirely.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'appwrite') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/appwrite/dist/cjs/sdk.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
