# Backend Test Suite

This document describes the test suite for the Mentra backend application.

## Overview

The test suite uses Bun's built-in testing framework and includes:

- **Unit Tests**: Tests for individual services, models, and middleware
- **Integration Tests**: End-to-end API tests with real HTTP requests
- **In-Memory Database**: MongoDB Memory Server for isolated test environments

## Structure

```
src/tests/
├── setup.ts                          # Test database setup and utilities
├── utils/
│   └── test-helpers.ts              # Mock data factories and helpers
├── services/
│   └── course.service.test.ts       # Service layer tests
├── middleware/
│   └── auth.test.ts                 # Authentication middleware tests
├── models/
│   └── course.model.test.ts         # Database model tests
└── integration/
    └── courses.test.ts              # API integration tests
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run specific test file
bun test src/tests/services/course.service.test.ts
```

## Test Categories

### Service Tests

Tests for business logic and permission checks:
- `isCourseOwner`: Verify ownership checks
- `isCourseMentor`: Verify mentor access
- `isEnrolled`: Verify enrollment status
- `canViewCourse`: Verify course visibility rules

### Middleware Tests

Tests for authentication and authorization:
- `authenticate`: JWT token validation
- `requireEmailVerification`: Email verification checks

### Model Tests

Tests for database operations:
- CRUD operations for courses, modules, and nodes
- Cascade deletions
- Enrollment management
- Progress tracking

### Integration Tests

End-to-end API tests:
- Course creation and management
- Access control and permissions
- Error handling and validation
- HTTP status codes and response formats

## Test Utilities

### Mock Data Factories

The `test-helpers.ts` file provides factories for creating test data:

```typescript
import { createMockUser, createMockCourse, createMockModule } from "./utils/test-helpers";

const user = createMockUser({ email: "custom@example.com" });
const course = createMockCourse({ visibility: "private" });
const module = createMockModule(courseId, { title: "Custom Module" });
```

### Database Setup

Each test suite uses an isolated in-memory MongoDB instance:

```typescript
import { setupTestDatabase, clearTestDatabase, teardownTestDatabase } from "./setup";

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase(); // Clean slate for each test
});
```

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from "../setup";

describe("My Service", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it("should do something", async () => {
    // Arrange
    const data = createMockData();

    // Act
    const result = await myService(data);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, beforeEach } from "bun:test";
import request from "supertest";
import { setupTestDatabase, clearTestDatabase } from "../setup";
import { generateTestToken } from "../utils/test-helpers";

describe("API Endpoint", () => {
  let app: express.Application;
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Setup Express app
  });

  beforeEach(async () => {
    await clearTestDatabase();
    authToken = generateTestToken(userId);
  });

  it("should handle request", async () => {
    const response = await request(app)
      .post("/api/endpoint")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ data: "test" })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clean State**: Use `beforeEach` to clear the database between tests
3. **Descriptive Names**: Use clear, descriptive test names
4. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
5. **Mock External Services**: Mock email services, external APIs, etc.
6. **Test Edge Cases**: Include tests for error conditions and edge cases
7. **Avoid Over-Mocking**: Use real database operations where possible

## Coverage Goals

- **Services**: 100% coverage of business logic
- **Controllers**: 90%+ coverage of request handlers
- **Middleware**: 100% coverage of authentication/authorization
- **Models**: 90%+ coverage of database operations

## Troubleshooting

### Tests Hanging

If tests hang, ensure you're properly cleaning up connections:

```typescript
afterAll(async () => {
  await teardownTestDatabase();
});
```

### Database Errors

Make sure MongoDB Memory Server is properly installed:

```bash
bun add -d mongodb-memory-server
```

### Authentication Failures

Verify JWT secret is set in test environment:

```typescript
process.env.JWT_SECRET = "test-secret";
```

## CI/CD Integration

The test suite is designed to run in CI/CD environments:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: bun test

- name: Check coverage
  run: bun test:coverage
```

## Future Enhancements

- [ ] Add performance/load tests
- [ ] Add end-to-end tests with browser automation
- [ ] Add mutation testing
- [ ] Add visual regression tests
- [ ] Add API contract tests
