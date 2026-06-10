# Nutchflow Frontend

The user interface for the Nutchflow application, built to visualize crawled data and manage scraping tasks.

## Tech Stack

- **React 19**: Modern UI library.
- **Vite**: Fast frontend build tool.
- **React Router**: For application routing.
- **D3** & **Recharts**: For creating interactive and dynamic charts to visualize scraped data.
- **Framer Motion**: For smooth UI animations.
- **Lucide React**: For beautiful iconography.
- **Socket.io-Client**: For receiving real-time updates from the backend server.
- **Axios**: Promise-based HTTP client for the browser.

## Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run preview`: Locally preview the production build.

## Setup

1. Install dependencies with `npm install`.
2. Configure your `.env` file to point to the backend API URL (if necessary).
3. Start the development server using `npm run dev`.

## Features

- **Dashboard**: Overview of scraping tasks and system health.
- **Real-time Status**: View live updates of running crawlers via WebSockets.
- **Data Visualization**: Explore extracted insights through advanced interactive charts.
