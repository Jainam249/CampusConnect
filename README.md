# CampusConnect – Lab 6

## Microservices and Inter-Service REST Communication

### 1. Project Overview

CampusConnect is a Student Management application developed as part of the Web Services & SOA laboratory.

In Lab 6, the monolithic backend from the previous lab has been decomposed into two independently runnable REST services:

- **Student Service** – manages student information.
- **Course Service** – manages course information.

The services communicate with each other using REST APIs and are deployed using Docker containers connected through a Docker network.

---

## 2. Objectives

The objectives of this laboratory are:

- To decompose an application into independent services.
- To implement REST-based communication between services.
- To containerize each service using Docker.
- To run multiple services using Docker Compose.
- To use a Docker network for inter-service communication.
- To configure services using environment variables.
- To implement failure handling when a dependent service is unavailable.
- To test and document the services using REST APIs and Swagger/OpenAPI.

---

## 3. System Architecture

The application consists of two backend services and one MongoDB database.

```text
                         Client
                           |
             +-------------+-------------+
             |                           |
             v                           v
    +------------------+        +------------------+
    | Student Service  |        |  Course Service  |
    |    Port 3001     |------->|    Port 3002     |
    +--------+---------+  REST  +--------+---------+
             |                           |
             |                           |
             +-------------+-------------+
                           |
                           v
                    +-------------+
                    |   MongoDB   |
                    |   Port 27017|
                    +-------------+

              Docker Network: student-network
```

The Student Service communicates with the Course Service through:

http://course-service:3002

inside the Docker network.

## 4. Project Structure

Lab 6/
│
├── student-services/
│ ├── server.js
│ ├── package.json
│ ├── Dockerfile
│ └── .dockerignore
│
├── course-services/
│ ├── server.js
│ ├── package.json
│ ├── Dockerfile
│ └── .dockerignore
│
├── student-client/
│
├── CampusConnectAndroid/
│
├── compose.yaml
├── .env
└── README.md

## 5. Student Service

The Student Service is responsible for managing student information.

Port
3001
Technology
Node.js
Express.js
MongoDB
Mongoose
Swagger/OpenAPI
CORS
Student Data

Each student contains:

\_id
name
email
course
semester
Student Service API
Method Endpoint Description
GET /students Get all students
GET /students/{id} Get a student by ID
POST /students Create a new student
PUT /students/{id} Update a student
DELETE /students/{id} Delete a student
GET /students/{id}/details Get student information together with course information

## 6. Course Service

The Course Service is responsible for managing course information.

Port
3002
Technology
Node.js
Express.js
MongoDB
Mongoose
CORS
Course Data

Each course contains:

\_id
name
code
department
Course Service API
Method Endpoint Description
GET /courses Get all courses
GET /courses/{id} Get a course by ID
POST /courses Create a new course

## 7. Inter-Service Communication

The Student Service communicates with the Course Service using a REST API.

The endpoint:

GET /students/{id}/details

first retrieves the requested student from the Student Service database.

The Student Service then sends a request to:

GET http://course-service:3002/courses

The Course Service returns the available courses.

The Student Service matches the student's course with the returned course information and sends a combined response.

Example Request
GET http://localhost:3001/students/6ab2097de95184c217af0a8c/details
Example Response
{
"student": {
"\_id": "6ab2097de95184c217af0a8c",
"name": "Test Student",
"email": "test@student.com",
"course": "MSc IT",
"semester": 3
},
"course": {
"\_id": "6ab20959448c952bc03320b6",
"name": "MSc IT",
"code": "IT001",
"department": "Information Technology"
}
}

This demonstrates successful REST-based communication between two independently running services.

## 8. Failure Handling

The Student Service depends on the Course Service when retrieving combined student and course information.

If the Course Service becomes unavailable, the Student Service handles the failure and returns:

HTTP/1.1 503 Service Unavailable

Example response:

{
"error": "Course Service is unavailable."
}

This prevents the Student Service from returning an incorrect successful response when its dependent service cannot be reached.

After restarting the Course Service, the inter-service request can be executed successfully again.

## 9. Docker Implementation

Each service has its own Dockerfile and is built as a separate Docker image.

Student Service Dockerfile

The Student Service uses:

node:20

and exposes:

3001
Course Service Dockerfile

The Course Service also uses:

node:20

and exposes:

3002

The services are therefore independently containerized and can be built and run separately.

## 10. Docker Compose

Docker Compose is used to run the complete application.

The Compose configuration contains three containers:

student-service
course-service
mongodb

The services are connected through:

student-network

MongoDB uses the Docker volume:

student-mongo-data

to persist database data.

## 11. Environment Variables

The Student Service uses the following environment variables:

PORT=3001
MONGODB_URI=mongodb://mongodb:27017/campusconnect_students
COURSE_SERVICE_URL=http://course-service:3002

The Course Service uses:

PORT=3002
MONGODB_URI=mongodb://mongodb:27017/campusconnect_courses

The COURSE_SERVICE_URL variable allows the Student Service to locate the Course Service using its Docker service name.

## 12. Docker Network

All three containers are connected to the same Docker bridge network:

student-network

This allows containers to communicate using Docker service names.

For example:

student-service
|
| HTTP REST request
v
course-service:3002

The Student Service does not need to use localhost to communicate with the Course Service inside Docker.

## 13. Running the Application

Make sure Docker Desktop is running.

Open a terminal in the project root directory.

Build and start all services
docker compose up --build

To run the containers in detached mode:

docker compose up --build -d
Check running containers
docker ps

The following containers should be running:

student-service
course-service
mongodb
Stop the application
docker compose down

## 14. Testing

The services were tested using REST requests.

Test Course Service
curl http://localhost:3002/courses
Test Student Service
curl http://localhost:3001/students
Test Inter-Service Communication
curl http://localhost:3001/students/6ab2097de95184c217af0a8c/details

The response contains both student and course information.

Test Failure Handling

The Course Service was stopped using:

docker stop course-service

The Student Service was then tested using:

curl -i http://localhost:3001/students/6ab2097de95184c217af0a8c/details

The service correctly returned:

HTTP/1.1 503 Service Unavailable

with:

{
"error": "Course Service is unavailable."
}

The Course Service was then restarted using:

docker start course-service

After restarting, inter-service communication was restored successfully.

## 15. Swagger / OpenAPI Documentation

Swagger UI is available for the Student Service at:

http://localhost:3001/api-docs

The Swagger documentation provides interactive documentation for the Student Service REST APIs.

The documented operations include:

GET /students
GET /students/{id}
POST /students
PUT /students/{id}
DELETE /students/{id}
GET /students/{id}/details

## 16. Verification Results

The following functionality was verified successfully:

Test Result
Student Service starts PASS
Course Service starts PASS
MongoDB starts PASS
GET /students PASS
GET /courses PASS
Student → Course REST communication PASS
Combined student/course response PASS
Course Service failure detection PASS
HTTP 503 failure response PASS
Service recovery after restart PASS
Swagger/OpenAPI documentation PASS
Docker networking PASS
Separate Docker images PASS 17. Evidence / Screenshots

The following screenshots are included in the laboratory submission:

All Docker containers running.
Course Service /courses response.
Student Service /students response.
Successful inter-service communication.
Failure handling with HTTP 503.
Swagger/OpenAPI documentation.
Docker images for the services.
Docker network containing the application containers.

## 18. Conclusion

The CampusConnect backend was successfully decomposed into two independently runnable services: Student Service and Course Service.

Both services were containerized using Docker and connected through a Docker network. REST-based communication was implemented between the Student Service and Course Service.

The system was tested for normal operation, inter-service communication, service failure, and recovery. When the Course Service was unavailable, the Student Service correctly returned an HTTP 503 response.

The implementation demonstrates service decomposition, REST-based inter-service communication, Docker containerization, Docker networking, environment-based configuration, and basic failure handling.
