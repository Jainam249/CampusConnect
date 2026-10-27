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

### Local vs Cloud Architecture

| Layer | Local (Docker Compose) | Cloud (Render) |
| :--- | :--- | :--- |
| **Entry** | Postman / React (`localhost:3000`) | Internet client (`https://<gateway-public-url>`) |
| **Gateway** | API Gateway container (`campusconnect-gateway`) | Public API Gateway Web Service |
| **Network** | Docker bridge network (`student-network`) | Cloud internal network / HTTPS |
| **Services** | Student, Course, Order (service names) | Student, Course, Order (service URLs) |
| **Database** | MongoDB container | MongoDB Atlas (Cloud) |

*What stays the same:* application code, routes, API contract.  
*What changes:* where it runs, how service URLs are resolved, and public exposure of the gateway.

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

### Static / Configuration-Based Service Discovery

In this implementation, service locations are externalized into environment variables rather than hardcoded in routing logic:

```env
USER_SERVICE_URL=http://student-service:3001
PRODUCT_SERVICE_URL=http://course-service:3002
ORDER_SERVICE_URL=http://order-service:3003
```

The gateway reads this configuration at startup and builds its routing table dynamically. Changing a target URL/port requires only an environment variable change—no application code is modified.

### Local vs Cloud Service URLs

| Environment | Service URL Example | Purpose |
| :--- | :--- | :--- |
| **Local Docker Compose** | `http://student-service:3001` | Service name resolution within internal Docker bridge network |
| **Cloud Internal Service** | `https://campusconnect-student-service.onrender.com` | Platform-provided public / private URL |
| **Public API Gateway** | `https://campusconnect-gateway-608i.onrender.com` | Single internet-facing entry point for all client traffic |

> **Key Principle:** Service locations must be configuration, not application code. The exact same application container image runs locally and in the cloud simply by changing environment variables.

### Dynamic Service Discovery vs Static Configuration

| Feature | Static / Config-Based (Lab 7) | Dynamic Discovery (Consul, Eureka, K8s DNS) |
| :--- | :--- | :--- |
| **Service Registration** | Manually configured via env vars or config files | Automatic self-registration on service boot |
| **Health Checking** | Unaware; gateway attempts routing until timeout/error | Continual active health checks; unregisters failed instances |
| **Horizontal Scaling** | Requires manual restart / re-configuration for new IPs | Automatically tracks and load-balances across all running replicas |
| **Instance Failure** | Handled reactively (503 on error) | Proactive de-registration; traffic diverted before failures occur |
| **Complexity** | Lightweight, zero extra infrastructure | Requires dedicated registry cluster (etcd/Consul/Eureka) |

**What a dynamic registry adds that static config cannot:**
1. **Automatic Life-Cycle Tracking:** Services dynamically register on startup and de-register on graceful shutdown or crash.
2. **Real-Time Health-Aware Routing:** Actively evicts unhealthy containers from the routing pool before client requests arrive.
3. **Seamless Elastic Auto-Scaling:** New service replicas automatically receive traffic without gateway redeployments or configuration updates.
4. **Dynamic Client/Server Load Balancing:** Spreads load dynamically across multi-node or multi-region replicas.

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

## 10. Cloud Deployment

The application is configured for deployment using Render and MongoDB Atlas.

### Cloud Deployment Sequence

1. **Verify local system:** Confirm all microservices (`student-service`, `course-service`, `order-service`, `gateway`) function correctly in Docker Compose.
2. **Build service images:** Ensure Dockerfiles build clean, self-contained container images.
3. **Select cloud platform:** Render (`render.com`) was chosen for cloud web services and API Gateway hosting.
4. **Push / build images:** Push repository code to GitHub and connect Web Services on Render.
5. **Deploy services:** Deploy Student Service, Course Service, and Order Service as independent cloud services.
6. **Configure environment variables:** Set runtime configurations (`PORT`, `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`) via the Render Dashboard.
7. **Configure MongoDB Atlas:** Provision an Atlas M0 cluster, configure database users, and whitelist network access (`0.0.0.0/0`).
8. **Deploy API Gateway:** Deploy the API Gateway container, referencing cloud service URLs.
9. **Obtain public gateway URL:** Note the internet-facing domain (`https://campusconnect-gateway-608i.onrender.com`).
10. **Test through public URL:** Execute end-to-end Postman integration tests against the live gateway URL.

### MongoDB Atlas and Environment Configuration

Environment variables configured on Render:

```env
MONGODB_URI=<MongoDB Atlas connection string>
USER_SERVICE_URL=<service URL>
PRODUCT_SERVICE_URL=<service URL>
ORDER_SERVICE_URL=<service URL>
```

> **Security Note:** Secrets, passwords, and MongoDB Atlas connection URIs are managed through platform secrets and environment variables—never committed directly to GitHub.

### Deployment URLs

| Component | Deployment URL |
| :--- | :--- |
| **API Gateway** | `https://campusconnect-gateway-608i.onrender.com` |
| **Student Service** | `https://campusconnect-student-service.onrender.com` |
| **Course Service** | `https://campusconnect-course-service.onrender.com` (Or Docker local) |
| **Order Service** | `https://campusconnect-order-service-wgs4.onrender.com` |

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

The APIs are tested using Postman with both local (`http://localhost:3000`) and cloud (`https://campusconnect-gateway-608i.onrender.com`) environments.

### Hands-On Exercise: Gateway Failure Test

To demonstrate centralized error handling, an explicit failure and recovery test was performed:

1. **Start all services:** Gateway, Student Service, Course Service, Order Service running.
2. **Normal Request (200 OK):**
   - Sent `GET /users/101` through the Gateway (`http://localhost:3000/users/101`).
   - Gateway proxied to Student Service and returned `200 OK` with student record.
3. **Stop the User Service:**
   - Ran `docker compose stop student-service`.
4. **Repeat the Request through Gateway:**
   - Sent `GET /users/101` through Gateway again.
5. **Verify 503/502 Error Handling:**
   - Gateway did not hang or crash.
   - Clean `503 Service Unavailable` response returned immediately:
     ```json
     {
       "error": "User Service unavailable",
       "message": "The requested microservice (User Service) is unreachable or down.",
       "statusCode": 503
     }
     ```
6. **Restart User Service & Verify Recovery:**
   - Ran `docker compose start student-service`.
   - Re-sent `GET /users/101`.
   - Verified immediate recovery with `200 OK`.

### Cloud Testing

The full suite was re-run against the public Gateway URL (`https://campusconnect-gateway-608i.onrender.com`):
- `GET /health` -> `200 OK`
- `GET /users` & `GET /users/101` -> `200 OK`
- `POST /users` -> `201 Created`
- `GET /orders` & `POST /orders` -> `200 OK` / `201 Created`
- Inter-service validation confirmed: Order Service successfully called Student Service and Course Service before persisting data to MongoDB Atlas.

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

## 17. Final Checklist

| API Gateway | Service Discovery | Cloud Deployment | Evidence |
| :--- | :--- | :--- | :--- |
| [x] `api-gateway` service created | [x] Service URLs in env vars / config | [x] Cloud platform chosen (Render) | [x] Postman: gateway routes |
| [x] Routes to User / Product / Order | [x] No hard-coded URLs in route code | [x] Gateway + services deployed | [x] Postman: `/health` check |
| [x] `GET /health` implemented | [x] Config change proven without code change | [x] Env vars set; Atlas connected, no secrets committed | [x] Failure test: 502/503 + recovery |
| [x] Request logging added | [x] Static vs dynamic discussed in README | [x] Public gateway URL reachable | [x] Cloud deployment screenshots |
| [x] 502/503 on unreachable service | [x] Local vs cloud URLs understood | [x] Postman re-tested on public URL | [x] Updated `README.md` |

---

