// Runs BEFORE jest-expo preset setup files
// Provides globals that Expo's winter runtime tries to polyfill lazily

// Provide structuredClone if not present (prevents expo winter runtime from loading @ungap/structured-clone)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

// Prevent expo winter runtime lazy getters from trying to import outside scope
Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: { url: 'http://localhost/' },
  writable: true,
  configurable: true,
});
