# Nutchflow

Nutchflow is a full-stack web scraping and crawling application. It features a Node.js backend using Puppeteer and Cheerio for data extraction, and a React frontend for data visualization and management.

## Project Structure

The project is divided into two main parts:
- `backend/`: The Node.js server that handles API requests, scheduling, and web crawling tasks.
- `frontend/`: The React (Vite) application that provides the user interface.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine. You will also need a MongoDB instance running, as the backend uses Mongoose.

### Installation

To install dependencies for both the backend and frontend at once, run the following command from the root directory:

```bash
npm run install:all
```

### Running the Application Locally

You can start both the frontend and backend concurrently using a single command from the root directory:

```bash
npm run dev
```

This will start:
- The backend server on its designated port.
- The frontend Vite development server.

## Features

- **Distributed Crawling**: Utilizes a worker model to process scraping jobs.
- **Data Visualization**: Interactive charts and data representation using D3 and Recharts on the frontend.
- **Real-time Updates**: Socket.io integration provides real-time notifications of crawling progress.
- **AI Integration**: Uses Google's Generative AI for advanced data processing.

## License

Private Project.
