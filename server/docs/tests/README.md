# Test Suite Documentation Index

This directory contains documentation for all API endpoint test suites in the Flowy Form server.

## Test Documentation Files

### Core Test Infrastructure

- **[basic-tests.md](./basic-tests.md)** - Basic test infrastructure verification
  - Jest configuration validation
  - Test runner functionality

### API Endpoint Test Suites

#### Authentication & User Management

- **[auth-tests.md](./auth-tests.md)** - Authentication endpoints (`/api/auth`)
  - GitHub OAuth callback flow
  - User session management
  - Authentication token handling
  - User creation and updates

- **[settings-tests.md](./settings-tests.md)** - User settings endpoints (`/api/settings`)
  - Profile retrieval and updates
  - Account deletion
  - Data security and filtering

#### Form Management

- **[forms-tests.md](./forms-tests.md)** - Form CRUD endpoints (`/api/forms`)
  - Form creation, retrieval, updates
  - Public/private form access control
  - Schema management
  - Form ownership verification

- **[versions-tests.md](./versions-tests.md)** - Version management (`/api/forms/:id/versions`)
  - Version history tracking
  - SHA-based version identification
  - Version creation and updates
  - Latest version promotion

#### Data Collection

- **[submissions-tests.md](./submissions-tests.md)** - Form submissions (`/api/submissions`)
  - Submission creation and retrieval
  - Anonymous vs authenticated submissions
  - Access control and tokens
  - Public/private form submission handling

## Test Coverage Overview

Each test suite includes comprehensive coverage for:

### Success Scenarios ✅

- Happy path functionality
- Complete CRUD operations
- Proper data flow and responses

### Error Handling ❌

- Invalid inputs and parameters
- Missing required fields
- Database operation failures
- Network and service errors

### Security & Authorization 🔐

- Authentication requirements
- User permission verification
- Access control enforcement
- Data privacy protection

### Input Validation 📝

- Parameter type validation
- Required field enforcement
- Data format verification
- Boundary condition testing

### Edge Cases 🎯

- Empty data sets
- Boundary values
- Unusual input combinations
- Race conditions and concurrency

## Running Tests

### All Tests

```bash
bun test
```

### Specific Test Suite

```bash
bun test auth-simple
bun test forms-simple
bun test submissions-simple
bun test versions-simple
bun test settings-simple
```

### With Coverage

```bash
bun test --coverage
```

### Watch Mode (Development)

```bash
bun test --watch
```

## Test Architecture

### Mock Infrastructure

- **Database Mocking**: Custom Drizzle ORM mocks for all database operations
- **Service Layer Mocking**: Complete service method mocking for isolation
- **External API Mocking**: GitHub API and other external service mocks
- **Authentication Mocking**: JWT and middleware simulation

### Test Patterns

- **Arrange-Act-Assert**: Consistent test structure
- **Mock Isolation**: Each test uses fresh mocks
- **Error Simulation**: Comprehensive error scenario testing
- **Edge Case Coverage**: Boundary and unusual condition testing

### Test Data

- **Mock Objects**: Realistic test data for all entities
- **Validation Testing**: Input validation and sanitization
- **Security Testing**: Access control and authorization verification

## Key Benefits

1. **Regression Prevention**: Catches breaking changes before deployment
2. **Documentation**: Tests serve as living API behavior documentation
3. **Development Confidence**: Enables safe refactoring and feature development
4. **Quality Assurance**: Ensures consistent error handling across all endpoints
5. **Rapid Feedback**: Quick validation during development cycles
