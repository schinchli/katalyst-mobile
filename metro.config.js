const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

// ── CRITICAL: tell Expo Router where the app dir is (monorepo fix) ───────────
process.env.EXPO_ROUTER_APP_ROOT = "app";

const config = getDefaultConfig(projectRoot, { isCSSEnabled: true });

// ── Workspace: fix Metro server root for Expo Go tunnel ──────────────────────
// Expo's getDefaultConfig auto-detects the npm workspace (lms/) and adds ALL
// workspace packages as watchFolders. This makes lms/ the common ancestor
// (Metro server root), which prepends "mobile/" to every bundle path and
// breaks Expo Go ("could not connect to development server").
// Fix: reset watchFolders to empty — all deps are local to mobile/node_modules.
config.watchFolders = [];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// ── Performance: inline requires for faster JS startup ───────────────────────
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// ── Performance: reduce image transformation overhead ───────────────────────
config.transformer.assetPlugins = [];

module.exports = withNativeWind(config, { input: "./global.css" });
