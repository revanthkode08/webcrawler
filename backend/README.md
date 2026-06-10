# Nutchflow Backend

The backend service for Nutchflow, responsible for web crawling, scheduling, and providing an API for the frontend.

## Tech Stack

- **Node.js** & **Express**: For the core server framework.
- **MongoDB** & **Mongoose**: Database and object modeling.
- **Puppeteer** & **Cheerio**: For robust web scraping and DOM parsing.
- **Socket.io**: Real-time bidirectional event-based communication.
- **Google Generative AI**: For AI-powered data processing and insights.
- **node-cron**: For scheduling periodic scraping tasks.

## Scripts

- `npm start`: Starts the main server in production mode.
- `npm run dev`: Starts the main server with `nodemon` for development.
- `npm run worker`: Starts the background worker process responsible for executing heavy crawling tasks.

## Setup

1. Make sure MongoDB is running.
2. Configure your `.env` file with the necessary credentials (e.g., MongoDB URI, API keys).
3. Run `npm install` to install all dependencies.
4. Start the server using `npm run dev`.

## Architecture

The backend consists of a main server (`server.js`) that handles API routes, user authentication (JWT/bcrypt), and websocket connections. A separate background worker (`worker.js`) is used to decouple the resource-intensive Puppeteer scraping processes from the main thread.
