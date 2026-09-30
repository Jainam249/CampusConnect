const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

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

// Proxy error handler
function handleProxyError(err, req, res) {
  console.error(
    `[Gateway Error] ${req.method} ${req.originalUrl}:`,
    err.message,
  );

  if (!res.headersSent) {
    res.status(502).json({
      error: "Bad Gateway",
      message: "The requested microservice is unavailable.",
    });
  }
}

// User Service routes
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
      error: handleProxyError,
    },
  }),
);

// Product Service routes
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
      error: handleProxyError,
    },
  }),
);

// Order Service routes
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
      error: handleProxyError,
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
