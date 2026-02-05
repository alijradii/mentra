import swaggerJsdoc from "swagger-jsdoc";
import { getEnvNumber } from "./utils/env.js";

const PORT = getEnvNumber("PORT", 3010);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mentra API",
      version: "1.0.0",
      description: "API documentation for Mentra - A learning management platform",
      contact: {
        name: "Mentra API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            details: {
              type: "array",
              items: {
                type: "object",
              },
              description: "Validation error details (if applicable)",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            name: {
              type: "string",
              description: "User name",
            },
            isEmailVerified: {
              type: "boolean",
              description: "Whether the user's email is verified",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
          },
        },
        Course: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Course ID",
            },
            name: {
              type: "string",
              description: "Course name",
            },
            description: {
              type: "string",
              description: "Course description",
            },
            isPublic: {
              type: "boolean",
              description: "Whether the course is publicly accessible",
            },
            ownerId: {
              type: "string",
              description: "Course owner user ID",
            },
            mentorIds: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of mentor user IDs",
            },
            studentIds: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of student user IDs (for private courses)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Module: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Module ID",
            },
            name: {
              type: "string",
              description: "Module name",
            },
            courseId: {
              type: "string",
              description: "Course ID this module belongs to",
            },
            order: {
              type: "number",
              description: "Display order of the module",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Node: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Node ID",
            },
            name: {
              type: "string",
              description: "Node name",
            },
            moduleId: {
              type: "string",
              description: "Module ID this node belongs to",
            },
            content: {
              type: "string",
              description: "Node content/description",
            },
            order: {
              type: "number",
              description: "Display order of the node",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Enrollment: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Enrollment ID",
            },
            userId: {
              type: "string",
              description: "User ID",
            },
            courseId: {
              type: "string",
              description: "Course ID",
            },
            enrolledAt: {
              type: "string",
              format: "date-time",
              description: "Enrollment timestamp",
            },
            progress: {
              type: "object",
              description: "User progress in the course",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
