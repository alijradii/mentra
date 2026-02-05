# Swagger API Documentation

## Overview

Swagger UI has been set up to provide interactive API documentation for the Mentra backend.

## Accessing Swagger UI

Once your backend server is running, you can access the Swagger documentation at:

```
http://localhost:3010/api-docs
```

(Replace `3010` with your `PORT` environment variable if different)

## Features

- **Interactive API Testing**: Try out API endpoints directly from the browser
- **Complete API Documentation**: All routes are documented with:
  - Request/response schemas
  - Required parameters
  - Authentication requirements
  - Example payloads
- **OpenAPI 3.0 Specification**: Standards-compliant API documentation

## Using Authentication in Swagger

Many endpoints require JWT authentication. Here's how to authenticate in Swagger:

### Step 1: Login or Register

1. Find the **Authentication** section in Swagger UI
2. Try the `POST /api/auth/login` or `POST /api/auth/register` endpoint
3. Click "Try it out"
4. Enter your credentials in the request body:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
5. Click "Execute"
6. Copy the `token` from the response

### Step 2: Authorize Swagger UI

1. Click the **Authorize** button (🔓 lock icon) at the top of the page
2. In the "Value" field, enter: `Bearer YOUR_TOKEN_HERE`
   - Replace `YOUR_TOKEN_HERE` with the token you copied
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click "Authorize"
4. Click "Close"

### Step 3: Test Protected Endpoints

Now you can test any protected endpoint:
- All endpoints with a 🔒 lock icon require authentication
- They will automatically include your JWT token in the Authorization header

## API Categories

The API is organized into these categories:

- **Authentication**: User registration, login, email verification
- **Courses**: Course CRUD operations
- **Modules**: Module management within courses
- **Nodes**: Learning content nodes within modules
- **Students**: Student enrollment management
- **Mentors**: Mentor management for courses
- **Enrollments**: Course enrollment operations
- **Examples**: Demo/example endpoints

## Tips

1. **Explore Schemas**: Click on the schema models at the bottom to see data structures
2. **Try Different Responses**: Test different inputs to see various response codes
3. **Use Examples**: Each request has example values you can use as templates
4. **Check Response Codes**: 
   - 200/201: Success
   - 400: Validation error
   - 401: Not authenticated
   - 403: Not authorized
   - 404: Not found
   - 500: Server error

## Development

### Adding New Endpoints

To add documentation for new endpoints, use JSDoc-style comments in your route files:

```typescript
/**
 * @swagger
 * /api/your-route:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response
 */
router.get("/your-route", authenticate, yourHandler);
```

### Updating Schemas

Edit `/apps/backend/src/swagger.ts` to add or modify schema definitions in the `components.schemas` section.

## Troubleshooting

**Issue**: Swagger UI shows "Failed to load API definition"
- **Solution**: Check console for errors, ensure all route files exist and syntax is correct

**Issue**: Authentication not working
- **Solution**: Make sure you're using the format `Bearer YOUR_TOKEN` (with "Bearer " prefix)

**Issue**: Endpoint not showing up
- **Solution**: Ensure the route file is in `./src/routes/*.ts` and has proper `@swagger` JSDoc comments

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
