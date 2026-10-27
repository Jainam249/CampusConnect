const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Enable CORS for browser (React) clients as specified in Lab 7
app.use(cors());

const PORT = process.env.PORT || 3000;

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://student-service:3001";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://course-service:3002";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:3003";

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    console.log(
      `[Gateway] ${req.method} ${req.originalUrl} | ` +
        `Status: ${res.statusCode} | ` +
        `Duration: ${Date.now() - startTime}ms`,
    );
  });

  next();
});

// Root welcome endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "CampusConnect API Gateway is running.",
    endpoints: {
      health: "/health",
      users: "/users",
      products: "/products",
      orders: "/orders",
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "API Gateway",
    timestamp: new Date().toISOString(),
  });
});

// Centralized proxy error handler factory (returns clean 503/502 JSON error response)
function createProxyErrorHandler(serviceName) {
  return (err, req, res) => {
    console.error(
      `[Gateway Error] ${req.method} ${req.originalUrl} -> ${serviceName}:`,
      err.message,
    );

    if (!res.headersSent) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: `${serviceName} unavailable`,
          message: `The requested microservice (${serviceName}) is unreachable or down.`,
          statusCode: 503,
        }),
      );
    }
  };
}

// User Service routes (/users/* -> User Service)
app.use(
  "/users",
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => (path === "/" ? "/students" : `/students${path}`),
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(
          `[Gateway] Forwarding ${req.method} ${req.originalUrl} ` +
            `to User Service: ${USER_SERVICE_URL}`,
        );
      },
      error: createProxyErrorHandler("User Service"),
    },
  }),
);

// Product Service routes (/products/* -> Product Service)
app.use(
  "/products",
  createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => (path === "/" ? "/courses" : `/courses${path}`),
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(
          `[Gateway] Forwarding ${req.method} ${req.originalUrl} ` +
            `to Product Service: ${PRODUCT_SERVICE_URL}`,
        );
      },
      error: createProxyErrorHandler("Product Service"),
    },
  }),
);

// Order Service routes (/orders/* -> Order Service)
app.use(
  "/orders",
  createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => (path === "/" ? "/orders" : `/orders${path}`),
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(
          `[Gateway] Forwarding ${req.method} ${req.originalUrl} ` +
            `to Order Service: ${ORDER_SERVICE_URL}`,
        );
      },
      error: createProxyErrorHandler("Order Service"),
    },
  }),
);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} does not exist on the API Gateway.`,
  });
});

// Start Gateway
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`User Service: ${USER_SERVICE_URL}`);
  console.log(`Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`Order Service: ${ORDER_SERVICE_URL}`);
});
