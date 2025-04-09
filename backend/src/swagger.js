const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dhanvantri Healthcare Platform API',
      version: '1.0.0',
      description: 'API documentation for the Dhanvantri Healthcare Platform',
    },
    servers: [
      {
        url: 'https://api.ysinghc.me/v1',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
