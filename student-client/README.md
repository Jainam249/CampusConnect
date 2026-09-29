# CampusConnect – Lab 4: Full-Stack Client & Database Integration

## Overview

CampusConnect is a Student Management application developed for Web Services & SOA Lab 4.

The project extends the Student REST API from the previous lab by integrating it with MongoDB Atlas for persistent storage. The same REST API is consumed by a React web client and an Android client.

The application supports student CRUD operations:

- Create a student
- Retrieve all students
- Retrieve a single student
- Update a student
- Delete a student

## Architecture

The project follows a client-server architecture:

```text
                    ┌──────────────────┐
                    │   React Client   │
                    │ localhost:5173   │
                    └────────┬─────────┘
                             │
                             │ HTTP / REST API
                             ▼
                    ┌──────────────────┐
                    │   Express API    │
                    │ localhost:3000   │
                    └────────┬─────────┘
                             │
                             │ Mongoose
                             ▼
                    ┌──────────────────┐
                    │   MongoDB Atlas  │
                    │ Student Database │
                    └──────────────────┘

                    ┌──────────────────┐
                    │  Android Client  │
                    │  Retrofit Client │
                    └────────┬─────────┘
                             │
                             │ HTTP / REST API
                             ▼
                         Express API
```

The React and Android applications communicate with the Express server using REST API requests. The clients do not connect directly to MongoDB. This keeps the database credentials and business logic on the server and allows multiple clients to use the same API.

Technologies Used
Backend
Node.js
Express.js
MongoDB Atlas
Mongoose
dotenv
CORS
Swagger UI
Web Client
React
Vite
JavaScript
Fetch API
Android Client
Kotlin
Jetpack Compose
Retrofit
Gson
REST API Endpoints
Operation Method Endpoint Expected Response
Get all students GET /students 200 OK
Get one student GET /students/:id 200 OK / 404
Add student POST /students 201 Created / 400
Update student PUT /students/:id 200 OK / 404
Delete student DELETE /students/:id 200 OK / 204 / 404
Student Data

Each student contains the following fields:

{
"\_id": "student_id",
"name": "Jainam",
"email": "jainam@mail.com",
"course": "M.Sc IT",
"semester": 3
}
Validation and Error Handling

The application handles common HTTP responses:

400 Bad Request – Invalid or missing student data
404 Not Found – Student does not exist
200 OK – Successful GET or update request
201 Created – Student successfully created
204 No Content – Student successfully deleted
Network/server errors are displayed to the client using appropriate error messages

The React application displays validation and error messages in the user interface.

Database Integration

MongoDB Atlas is used for persistent storage.

The backend connects to MongoDB using Mongoose and stores student records in the database. Unlike the in-memory implementation from the previous lab, student data remains available after restarting the Node.js server.

The MongoDB connection string and server configuration are stored using environment variables.

Example .env configuration:

PORT=3000
MONGODB_URI=your_mongodb_connection_string

The actual MongoDB connection string is not included in the repository for security reasons.

Running the Backend

Navigate to the backend project directory:

cd "Lab 4"

Install dependencies:

npm install

Create a .env file containing:

PORT=3000
MONGODB_URI=your_mongodb_connection_string

Start the server:

npm start

The API will run at:

http://localhost:3000

Swagger documentation is available at:

http://localhost:3000/swagger
Running the React Client

Navigate to the React client directory:

cd student-client

Install dependencies:

npm install

Create a .env file:

VITE_API_BASE_URL=http://localhost:3000

Start the development server:

npm run dev

The React application will be available at:

http://localhost:5173

The API base URL is stored in one place using:

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

This makes it easier to switch between local and deployed environments without changing every API request.

React Client Features

The React client provides full CRUD functionality:

Displays all students
Adds a new student
Validates form input
Edits an existing student
Deletes a student
Displays success and error messages
Refreshes the displayed student data after CRUD operations
Android Client

An Android client was created using Kotlin and Jetpack Compose.

The Android application contains:

A screen to display students
A form to add a student
Retrofit for REST API communication
Toast messages for success and error handling

When using the Android emulator, the API base URL is configured as:

http://10.0.2.2:3000/

This allows the Android emulator to access a server running on the development machine.

Testing

The REST API was tested using:

Postman
Swagger UI
React web client

The following operations were tested:

GET all students
GET a single student
POST a new student
PUT/PATCH an existing student
DELETE a student
Invalid request handling with 400 Bad Request
Missing student handling with 404 Not Found
MongoDB persistence after restarting the server
Reflection

This lab demonstrated how the same REST API can be consumed by different types of clients. The React web client and Android client communicate with the backend using HTTP requests instead of directly accessing the database. React uses the Fetch API and manages data using hooks such as useState and useEffect, while Android uses Retrofit and Kotlin coroutines for network communication. The API provides a common interface for both platforms. MongoDB Atlas adds persistent storage, allowing student data to remain available after restarting the server. This architecture makes the application easier to maintain and allows additional clients to be added in the future.

## Reflection

Both the React web client and Android mobile client consume the same REST API and use the same Student resource and HTTP endpoints. The main similarity is that both clients send HTTP requests and receive JSON responses from the Express.js backend. React uses JavaScript with fetch/axios and displays the data in a web browser, while Android uses Kotlin and Retrofit for network communication. The Android emulator also requires a different API base URL, using 10.0.2.2 instead of localhost. Error handling is displayed differently, with the React application showing messages in the UI and Android using Toast messages. This lab demonstrated how a single REST service can support multiple independent client applications.
