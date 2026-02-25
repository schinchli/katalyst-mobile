// Mock for @ungap/structured-clone
// Node.js 17+ has native structuredClone, so this is a passthrough
module.exports = globalThis.structuredClone ?? ((obj) => JSON.parse(JSON.stringify(obj)));
module.exports.default = module.exports;
