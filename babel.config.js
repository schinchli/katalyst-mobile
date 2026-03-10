module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Explicitly add expo-router plugin: babel-preset-expo's hasModule('expo-router') check
      // fails in this monorepo because expo-router lives in mobile/node_modules (not hoisted
      // to root), so require.resolve from babel-preset-expo's location can't find it.
      require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin,
      'react-native-reanimated/plugin',
    ],
  };
};
