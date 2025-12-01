// Jest setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for async tests
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
// Uncomment if needed:
// global.console.log = jest.fn();

// Clean up after all tests
afterAll(async () => {
  // Add any cleanup logic here
});
