const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;

// ── CRITICAL: tell Expo Router where the app dir is (monorepo fix) ───────────
process.env.EXPO_ROUTER_APP_ROOT = "app";

const config = getDefaultConfig(projectRoot);

// ── Performance: inline requires for faster JS startup ───────────────────────
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// ── Performance: reduce image transformation overhead ───────────────────────
config.transformer.assetPlugins = [];

module.exports = config;
