const express = require("express");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const COURSE_SERVICE_URL =
  process.env.COURSE_SERVICE_URL || "http://localhost:3002";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Root Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    service: "CampusConnect Student Service",
    status: "UP",
    endpoints: {
      students: "/students",
      swagger: "/swagger",
      openapi: "/openapi.json",
    },
  });
});

// =====================================================
// MongoDB Student Model
// =====================================================

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    versionKey: false,
  },
);

const Student = mongoose.model("Student", studentSchema);

// =====================================================
// Validation
// =====================================================

function validateStudent(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return ["Request body must be a JSON object."];
  }

  if (typeof body.name !== "string" || body.name.trim() === "") {
    errors.push("name is required.");
  }

  if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(body.email)
  ) {
    errors.push("email must be a valid email address.");
  }

  if (typeof body.course !== "string" || body.course.trim() === "") {
    errors.push("course is required.");
  }

  if (!Number.isInteger(body.semester) || body.semester < 1) {
    errors.push("semester must be a positive integer.");
  }

  return errors;
}

// =====================================================
// GET /students
// =====================================================

app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();

    res.status(200).json(students);
  } catch (error) {
    console.error("GET /students error:", error);

    res.status(500).json({
      error: "Failed to fetch students.",
    });
  }
});

// =====================================================
// GET /students/:id
// =====================================================

app.get("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(404).json({
      error: "Student not found.",
    });
  }
});

// =====================================================
// POST /students
// =====================================================

app.post("/students", async (req, res) => {
  const errors = validateStudent(req.body);

  if (errors.length) {
    return res.status(400).json({
      error: "Invalid student data.",
      details: errors,
    });
  }

  try {
    const student = await Student.create({
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      course: req.body.course.trim(),
      semester: req.body.semester,
    });

    res.status(201).location(`/students/${student._id}`).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Email already exists.",
      });
    }

    res.status(500).json({
      error: "Failed to create student.",
    });
  }
});

// =====================================================
// PUT /students/:id
// =====================================================

app.put("/students/:id", async (req, res) => {
  const errors = validateStudent(req.body);

  if (errors.length) {
    return res.status(400).json({
      error: "Invalid student data.",
      details: errors,
    });
  }

  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name.trim(),
        email: req.body.email.trim(),
        course: req.body.course.trim(),
        semester: req.body.semester,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!student) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    res.status(200).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Email already exists.",
      });
    }

    res.status(404).json({
      error: "Student not found.",
    });
  }
});

// =====================================================
// DELETE /students/:id
// =====================================================

app.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(404).json({
      error: "Student not found.",
    });
  }
});

// =====================================================
// GET /students/:id/details
// Student Service -> Course Service
// =====================================================

app.get("/students/:id/details", async (req, res) => {
  try {
    // Step 1: Get student from Student Service database
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        error: "Student not found.",
      });
    }

    // Step 2: Call Course Service
    const response = await fetch(`${COURSE_SERVICE_URL}/courses`);

    if (!response.ok) {
      return res.status(503).json({
        error: "Course Service is unavailable.",
      });
    }

    const courses = await response.json();

    // Step 3: Find the student's course
    const course = courses.find(
      (item) =>
        item.name.toLowerCase() === student.course.toLowerCase() ||
        item.code.toLowerCase() === student.course.toLowerCase(),
    );

    if (!course) {
      return res.status(404).json({
        error: "Course not found for this student.",
        student,
      });
    }

    // Step 4: Return combined response
    res.status(200).json({
      student,
      course,
    });
  } catch (error) {
    console.error("GET /students/:id/details error:", error);

    res.status(503).json({
      error: "Course Service is unavailable.",
    });
  }
});

// =====================================================
// OpenAPI Specification
// =====================================================

const openapi = {
  openapi: "3.0.3",

  info: {
    title: "CampusConnect Student API",
    version: "1.0.0",
    description:
      "RESTful Student Management Web Service for Web Services & SOA Lab 6",
  },

  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Local development server",
    },
  ],

  tags: [
    {
      name: "Students",
      description: "Student management operations",
    },
  ],

  paths: {
    "/students": {
      get: {
        tags: ["Students"],
        summary: "Get all students",
        responses: {
          200: {
            description: "List of students",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Student",
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
          },
        },
      },

      post: {
        tags: ["Students"],
        summary: "Create a new student",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/StudentInput",
              },

              example: {
                name: "Aarav Patel",
                email: "aarav@example.com",
                course: "Computer Science",
                semester: 5,
              },
            },
          },
        },

        responses: {
          201: {
            description: "Student created successfully",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Student",
                },
              },
            },
          },

          400: {
            description: "Invalid or incomplete request",
          },

          500: {
            description: "Internal server error",
          },
        },
      },
    },

    "/students/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,

          schema: {
            type: "string",
          },

          example: "MONGODB_OBJECT_ID",
        },
      ],

      get: {
        tags: ["Students"],
        summary: "Get a student by ID",

        responses: {
          200: {
            description: "Student found",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Student",
                },
              },
            },
          },

          404: {
            description: "Student not found",
          },

          500: {
            description: "Internal server error",
          },
        },
      },

      put: {
        tags: ["Students"],
        summary: "Update a student",

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/StudentInput",
              },

              example: {
                name: "Aarav Patel Updated",
                email: "aarav.updated@example.com",
                course: "MSc IT",
                semester: 4,
              },
            },
          },
        },

        responses: {
          200: {
            description: "Student updated successfully",

            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Student",
                },
              },
            },
          },

          400: {
            description: "Invalid or incomplete request",
          },

          404: {
            description: "Student not found",
          },

          500: {
            description: "Internal server error",
          },
        },
      },

      delete: {
        tags: ["Students"],
        summary: "Delete a student",

        responses: {
          204: {
            description: "Student deleted successfully",
          },

          404: {
            description: "Student not found",
          },

          500: {
            description: "Internal server error",
          },
        },
      },
    },

    "/students/{id}/details": {
      get: {
        tags: ["Students"],
        summary: "Get student details with course information",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Student MongoDB ID",

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Student and course information retrieved successfully",
          },

          404: {
            description: "Student or course not found",
          },

          503: {
            description: "Course Service is unavailable",
          },
        },
      },
    },
  },

  components: {
    schemas: {
      Student: {
        type: "object",

        properties: {
          _id: {
            type: "string",
            example: "64f123456789abcdef123456",
          },

          name: {
            type: "string",
            example: "Aarav Patel",
          },

          email: {
            type: "string",
            format: "email",
            example: "aarav@example.com",
          },

          course: {
            type: "string",
            example: "Computer Science",
          },

          semester: {
            type: "integer",
            example: 5,
          },
        },
      },

      StudentInput: {
        type: "object",

        required: ["name", "email", "course", "semester"],

        properties: {
          name: {
            type: "string",
            example: "Aarav Patel",
          },

          email: {
            type: "string",
            format: "email",
            example: "aarav@example.com",
          },

          course: {
            type: "string",
            example: "Computer Science",
          },

          semester: {
            type: "integer",
            minimum: 1,
            example: 5,
          },
        },
      },

      Course: {
        type: "object",

        properties: {
          _id: {
            type: "string",
            example: "64f123456789abcdef654321",
          },

          name: {
            type: "string",
            example: "MSc IT",
          },

          code: {
            type: "string",
            example: "IT001",
          },

          department: {
            type: "string",
            example: "Information Technology",
          },
        },
      },
    },
  },
};

// OpenAPI JSON endpoint
app.get("/openapi.json", (req, res) => {
  res.json(openapi);
});

// Swagger UI
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openapi));

// Invalid JSON handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON request body.",
    });
  }

  next(err);
});

// =====================================================
// Connect to MongoDB and Start Server
// =====================================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB container");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `CampusConnect Student API running at http://localhost:${PORT}`,
      );
      console.log(`Swagger UI: http://localhost:${PORT}/swagger`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
