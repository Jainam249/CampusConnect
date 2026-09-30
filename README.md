# CampusConnect – Lab 7

## API Gateway, Service Discovery & Cloud Deployment

**Course:** IT627 – Cloud Computing
**Project:** CampusConnect
**Lab:** 7

---

## 1. Overview

CampusConnect is a microservices-based application developed to demonstrate API Gateway architecture, service discovery, containerization, and cloud deployment.

This lab extends the Lab 6 implementation by introducing a centralized API Gateway and an Order Service. The Gateway acts as a single entry point for client requests and routes them to the appropriate backend microservice.

The application uses Docker Compose for local orchestration and MongoDB for persistent data storage. The services are configured using environment variables to support deployment across different environments.

### Objectives

- Implement a centralized API Gateway.
- Route client requests to independent microservices.
- Configure service discovery using environment variables.
- Containerize services using Docker.
- Orchestrate services using Docker Compose.
- Integrate MongoDB Atlas for cloud database connectivity.
- Deploy the application to a cloud platform.
- Test API functionality and error handling through the Gateway.

---

## 2. System Architecture

```text
                   Client / Postman
                          |
                          v
                 +------------------+
                 |   API Gateway    |
                 |    Port 3000     |
                 +------------------+
                    /      |      \
                   /       |       \
                  v        v        v
             +---------+ +---------+ +---------+
             | Student | | Course  | |  Order  |
             | Service | | Service | | Service |
             |  3001   | |  3002   | |  3003   |
             +---------+ +---------+ +---------+
                  |          |           |
                  v          v           v
             +---------+ +---------+ +---------+
             | MongoDB | | MongoDB | | MongoDB |
             |Students | | Courses | | Orders  |
             +---------+ +---------+ +---------+
                          |
                          v
                    MongoDB Atlas
```

The API Gateway is the intended public entry point for client requests. Backend services communicate using their configured service URLs.

---

## 3. Technology Stack

| Component          | Technology                        |
| ------------------ | --------------------------------- |
| Backend            | Node.js, Express.js               |
| Frontend           | HTML, CSS, JavaScript, React      |
| Mobile Application | Android, Kotlin                   |
| Database           | MongoDB, MongoDB Atlas            |
| ODM                | Mongoose                          |
| API Gateway        | Express.js, HTTP proxy middleware |
| Containerization   | Docker                            |
| Orchestration      | Docker Compose                    |
| API Testing        | Postman                           |
| Version Control    | Git, GitHub                       |
| Cloud Deployment   | Render                            |

---

## 4. Project Structure

```text
CampusConnect/
│
├── gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── student-services/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── course-services/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── order-services/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── student-client/
│   └── React frontend
│
├── CampusConnectAndroid/
│   └── Android application
│
├── backend-express/
│   └── Supporting backend files
│
├── css/
├── js/
├── assets/
│
├── compose.yaml
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Microservices

### Student Service

- Manages student records.
- Provides endpoints for retrieving and managing students.
- Connects to the Student MongoDB database.
- Runs on port 3001.

### Course Service

- Manages course records.
- Provides endpoints for retrieving and managing courses.
- Connects to the Course MongoDB database.
- Runs on port 3002.

### Order Service

- Manages order creation and retrieval.
- Validates user and product information by communicating with the Student and Course services.
- Stores order information in MongoDB.
- Returns appropriate error responses when dependent services are unavailable.
- Runs on port 3003.

### API Gateway

- Acts as the single entry point for client requests.
- Routes requests to the corresponding backend services.
- Centralizes request forwarding.
- Provides a health-check endpoint.
- Handles unavailable backend services through appropriate error responses.
- Runs on port 3000.

---

## 6. API Gateway Routes

The Gateway exposes the following routes:

| Gateway Endpoint | Destination     | Purpose              |
| ---------------- | --------------- | -------------------- |
| `GET /health`    | Gateway         | Check Gateway health |
| `/users`         | Student Service | Student operations   |
| `/products`      | Course Service  | Course operations    |
| `/orders`        | Order Service   | Order operations     |

Clients interact with the Gateway rather than directly calling individual services.

### Example Requests

```http
GET http://localhost:3000/health
GET http://localhost:3000/users
GET http://localhost:3000/products
GET http://localhost:3000/orders
```

Order creation:

```http
POST http://localhost:3000/orders
Content-Type: application/json
```

Example request body:

```json
{
  "userId": "<valid-student-id>",
  "productId": "<valid-course-id>",
  "quantity": 2
}
```

Use IDs that exist in the database connected to the running services.

---

## 7. Service Discovery

Service discovery enables microservices to locate and communicate with one another.

### Static Service Discovery

In this implementation, service locations are configured through environment variables.

Examples include:

```env
USER_SERVICE_URL=http://student-service:3001
PRODUCT_SERVICE_URL=http://course-service:3002
ORDER_SERVICE_URL=http://order-service:3003
```

These hostnames are examples for the Docker Compose network. The actual values depend on the deployment environment.

### Dynamic Service Discovery

Dynamic service discovery allows services to locate other services automatically through a registry or orchestration platform without manually maintaining fixed service addresses.

The current implementation uses environment-variable-based service configuration rather than a dedicated dynamic service registry.

---

## 8. Local Setup and Execution

### Prerequisites

- Node.js and npm
- Docker Desktop
- Git
- Postman
- MongoDB Atlas account (for cloud database configuration)

### Clone the Repository

```bash
git clone https://github.com/Jainam249/CampusConnect.git
cd CampusConnect
```

### Configure Environment Variables

Create the required `.env` files using the provided `.env.example` as a reference.

Configure the appropriate values for:

- Service ports
- MongoDB connection strings
- Student Service URL
- Course Service URL
- Order Service URL

Do not commit actual database credentials or secrets to GitHub.

### Start the Application

From the project root, run:

```bash
docker compose up --build
```

To run the containers in detached mode:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

---

## 9. Database Configuration

MongoDB is used for persistent storage.

The application supports separate databases for student, course, and order records.

For cloud deployment, MongoDB Atlas is configured through environment variables.

The database connection string should be supplied through the appropriate service configuration and must not be hardcoded into source files.

---

## 10. Cloud Deployment

The application is configured for deployment using Render and MongoDB Atlas.

### Deployment Overview

1. Create a MongoDB Atlas cluster.
2. Configure the database user and network access.
3. Configure the MongoDB connection strings.
4. Deploy the backend microservices.
5. Configure service URLs through environment variables.
6. Deploy the API Gateway.
7. Verify the Gateway's public endpoint.
8. Test all API routes through the deployed Gateway.

### Deployment URLs

| Component       | Deployment URL |
| --------------- | -------------- |
| API Gateway     | `https://campusconnect-gateway-608i.onrender.com` |
| Student Service | `https://campusconnect-student-service.onrender.com` |
| Course Service  | `https://campusconnect-course-service.onrender.com` (Or Docker local) |
| Order Service   | `https://campusconnect-order-service-wgs4.onrender.com` |

### Public Gateway Endpoint

```text
https://campusconnect-gateway-608i.onrender.com
```

Health check:

```text
https://campusconnect-gateway-608i.onrender.com/health
```

---

## 11. Testing and Validation

The APIs are tested using Postman.

### Local Testing

- Verify Gateway health.
- Retrieve student records through `/users`.
- Retrieve course records through `/products`.
- Create and retrieve orders through `/orders`.
- Verify that requests are forwarded to the correct service.
- Verify that invalid input produces appropriate error responses.
- Verify that unavailable backend services produce appropriate gateway errors.

### Cloud Testing

Repeat the API tests using the public Gateway URL.

Testing should verify:

- Successful responses from available services.
- Correct routing through the Gateway.
- Data persistence in MongoDB Atlas.
- Proper handling of invalid requests.
- Appropriate error responses when a dependent service is unavailable.

Screenshots of successful requests, error handling, and deployment status are included in the lab submission evidence.

---

## 12. Error Handling

The application includes error handling for service communication and request validation.

Examples include:

- Invalid request data.
- Missing required fields.
- Invalid student or course identifiers.
- Unavailable dependent services.
- Database connection failures.

The Gateway returns an appropriate error response when a backend service cannot be reached, rather than leaving the client request without a response.

---

## 13. Troubleshooting

| Issue                           | Possible Resolution                                                          |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Docker containers fail to start | Check Docker Desktop and inspect container logs                              |
| MongoDB connection fails        | Verify the connection string, database credentials, and Atlas network access |
| Gateway returns 502/503         | Check backend service status and configured service URLs                     |
| API returns 404                 | Verify the endpoint path and Gateway route configuration                     |
| Order creation fails            | Verify that the referenced student and course records exist                  |
| Cloud service fails to connect  | Check environment variables and service deployment status                    |
| Port already in use             | Stop the conflicting process or change the configured port                   |

Useful commands:

```bash
docker compose ps
docker compose logs -f gateway
docker compose logs -f student-service
docker compose logs -f course-service
docker compose logs -f order-service
```

---

## 14. Lab 6 vs Lab 7

| Lab 6                               | Lab 7                                       |
| ----------------------------------- | ------------------------------------------- |
| Direct service access               | Centralized API Gateway                     |
| Student and Course services         | Student, Course, and Order services         |
| Local Docker setup                  | Cloud deployment configuration              |
| Service communication within Docker | Environment-based service URL configuration |
| Local database configuration        | MongoDB Atlas integration                   |
| Individual API testing              | Gateway-based API testing                   |

Lab 7 extends the existing application by introducing centralized routing, additional service communication, and cloud deployment configuration while retaining the core microservice structure.

---

## 15. Reflection

Lab 7 builds upon the microservices implementation developed in Lab 6 by introducing an API Gateway and an additional Order Service. The Gateway provides a centralized entry point for client requests and simplifies communication with backend services. Docker Compose helps manage the services in a consistent local environment. Environment variables allow service URLs and database configurations to be changed without modifying application code. MongoDB Atlas provides a cloud-hosted database option. The deployment and testing process demonstrates how distributed services communicate and how failures can be handled across service boundaries.

---

## 16. Repository

**GitHub:** https://github.com/Jainam249/CampusConnect

---
