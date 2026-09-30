const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3003;

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/campusconnect_orders";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3001";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3002";

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      default: "PLACED",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Order = mongoose.model("Order", orderSchema);

// Root Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "CampusConnect Order Service",
    status: "UP",
    endpoints: {
      health: "/health",
      orders: "/orders",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "Order Service",
  });
});

// Create an order
app.post("/orders", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({
        error: "userId, productId and quantity are required",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        error: "Quantity must be a positive integer",
      });
    }

    // Validate User through User Service
    const userResponse = await fetch(
      `${USER_SERVICE_URL}/students/${encodeURIComponent(userId)}`,
    );

    if (userResponse.status === 404) {
      return res.status(400).json({
        error: "Invalid userId. User does not exist.",
      });
    }

    if (!userResponse.ok) {
      return res.status(503).json({
        error: "User Service is unavailable",
      });
    }

    // Validate Product through Product Service
    const productResponse = await fetch(
      `${PRODUCT_SERVICE_URL}/courses/${encodeURIComponent(productId)}`,
    );

    if (productResponse.status === 404) {
      return res.status(400).json({
        error: "Invalid productId. Product does not exist.",
      });
    }

    if (!productResponse.ok) {
      return res.status(503).json({
        error: "Product Service is unavailable",
      });
    }

    // Save order
    const order = new Order({
      userId,
      productId,
      quantity,
      status: "PLACED",
    });

    const savedOrder = await order.save();

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);

    res.status(503).json({
      error: "Unable to create order",
      message: error.message,
    });
  }
});

// Get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);

    res.status(500).json({
      error: "Unable to fetch orders",
    });
  }
});

// Get order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({
      error: "Invalid order ID",
    });
  }
});

// Start server after connecting to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Order Service connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
