// Jest setup file for additional matchers and global configuration

// Custom matchers can be added here if needed
// For example: import '@testing-library/jest-dom';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
