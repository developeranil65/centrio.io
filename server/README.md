# Centrio.io Server

This repository contains the backend service and real-time signalling server for Centrio.io.

## Architecture and Technology Stack

The server handles REST API requests, persistent data storage, and WebSocket connections for real-time state synchronization and WebRTC signalling.

### Core Technologies
*   **Runtime Environment:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB
*   **ODM:** Mongoose
*   **WebSocket Engine:** Socket.io
*   **Authentication:** JSON Web Tokens (JWT) and bcryptjs
*   **File Handling:** Multer for asset uploads

## System Architecture

The server is cleanly separated into RESTful routes for state management and dedicated WebSocket handlers for real-time collaboration.

### Socket Handlers
The WebSocket architecture is modularized to handle distinct domains of real-time interaction:
*   `drawing.handler.js`: Synchronizes stroke data and shape mutations on the Konva canvas.
*   `cursor.handler.js`: Broadcasts live cursor coordinates and remote pointer states.
*   `diagram.handler.js`: Manages entity-relationship diagram connections and structured data interactions.
*   `video.handler.js`: Routes WebRTC signalling offers, answers, and ICE candidates strictly via `socket.id` mapping.
*   `chat.handler.js`: Manages real-time text messaging within the workspace context.

## Setup and Installation

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB instance (local or Atlas)

### Installation Steps

1.  Navigate to the server directory:
    ```bash
    cd server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the root of the `server` directory with the following keys:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secure_jwt_secret
    CLIENT_URL=http://localhost:5173
    ```

4.  Start the development server (with hot reloading):
    ```bash
    npm run dev
    ```
    Alternatively, start the production server:
    ```bash
    npm start
    ```

## API Core Security

*   Request validation is strictly enforced using `express-validator`.
*   JSON Web Tokens (JWT) are used for stateless API authentication.
*   `helmet` and carefully configured `cors` middleware are implemented to protect against standard vulnerabilities.
*   WebRTC interactions use unguessable, session-bound WebSocket IDs to prevent cross-talk.
