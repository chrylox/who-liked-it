# Unit Tests for Who Liked It?

This directory contains unit tests for the Who Liked It? application.

## Test Files

- `utils.test.js` - Tests for utility functions (error handling, URL parsing, game state)
- `tiktok.test.js` - Tests for TikTok URL validation and parsing
- `gameLogic.test.js` - Tests for game logic (round management, standings, lobby state)
- `resolve-tiktok-link.test.js` - Tests for the TikTok link resolution function

## Running Tests

### Prerequisites

Install Node.js (v16 or later recommended).

### Installation

```bash
npm install
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run a specific test file
npx jest __tests__/utils.test.js

# Run tests matching a pattern
npx jest --testNamePattern="extractTikTokVideoId"

# Run tests for a specific describe block
npx jest --testNamePattern="TikTok URL handling"
```

## Test Coverage

The tests cover:

### Utility Functions
- Error message extraction from GraphQL errors
- Constraint violation detection
- Permission check failure detection
- URL pattern matching
- Video ID extraction
- Time calculations (msSince)
- Round picking logic
- Avatar handling
- Tab switching

### TikTok URL Handling
- URL pattern validation
- Video ID extraction from various URL formats
- Short link host detection
- URL normalization

### Game Logic
- Round state management
- Current round selection
- Game progress tracking
- Standings calculation
- Lobby state determination
- Video pool management
- Guess management

### Link Resolution
- URL validation
- Redirect following
- Video ID extraction from resolved URLs
- Error handling

## Test Environment

Tests run in a JSDOM environment, which simulates a browser environment for testing DOM-dependent code. However, the tests focus on pure functions that don't require actual DOM manipulation.

## Adding New Tests

1. Create a new `.test.js` file in the `__tests__` directory
2. Use `describe()` to group related tests
3. Use `it()` or `test()` for individual test cases
4. Use `expect()` for assertions

Example:

```javascript
describe('New Feature', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

## Mocking

For functions that depend on external services (like Nhost), create mock implementations that simulate the behavior without making actual network requests.

## Best Practices

- Test pure functions independently
- Mock external dependencies
- Use descriptive test names
- Test edge cases and error conditions
- Keep tests fast and isolated
