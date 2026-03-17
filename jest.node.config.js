/** Lightweight Jest config for pure Node.js utility/service tests.
 *  Bypasses the jest-expo React Native environment entirely — no Metro,
 *  no jsdom, no native module shims. Runs ~10x faster. */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/utils/**/*.test.ts', '**/__tests__/services/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: false } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Stub out react-native's Platform so haptics.test.ts can import it
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
};
