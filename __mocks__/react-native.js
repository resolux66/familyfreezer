// Minimal react-native stub for pure utility tests.
// Only exports what src/utils/haptics.ts actually imports.
module.exports = {
  Platform: {
    OS: 'ios',  // default — overridden per-test in haptics.test.ts
    select: (obj) => obj.ios ?? obj.default,
  },
};
