# Centrio.io Client

This repository contains the frontend application for Centrio.io, a real-time collaborative whiteboard and diagramming platform.

## Architecture and Technology Stack

The client application is built as a Single Page Application (SPA) designed for high performance and real-time collaboration.

### Core Technologies
*   **Framework:** React 19 (via Vite)
*   **Graphics & Rendering:** Konva.js / React-Konva for high-performance 2D canvas manipulation.
*   **Real-time Communication:** Socket.io-client for WebSocket-based synchronization of state and chat.
*   **WebRTC/Video Calls:** Simple-peer for establishing peer-to-peer video and audio conferencing.
*   **Animations:** Framer Motion for UI micro-interactions.
*   **Styling:** Raw CSS with custom design tokens.

## Features Overview

*   **Real-time Collaboration:** Live cursor tracking and instantaneous shape rendering across connected clients.
*   **Infinite Canvas Engine:** Features tools for free-hand drawing, dynamic shapes, text nodes, sticky notes, and ER diagram tables.
*   **Integrated Video Conferencing:** WebRTC-powered video and audio calls with screen sharing capabilities embedded directly into the workspace.
*   **Workspace Management:** Interactive dashboards for managing boards, pages, and user access.
*   **Export Capabilities:** High-resolution PNG and multi-page PDF exporting logic.

## Setup and Installation

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation Steps

1.  Navigate to the client directory:
    ```bash
    cd client
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the root of the `client` directory and define the backend API URL:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will typically be accessible at `http://localhost:5173`.

## Build and Deployment

The application uses Vite for optimized production builds.

To create a production bundle:
```bash
npm run build
```

The output will be generated in the `dist` directory. For deployment to platforms like Vercel, the provided `vercel.json` ensures that client-side routing falls back to `index.html`.
