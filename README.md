# 🕸️ Nutchflow

[![Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://webcrawler-red.vercel.app/home)

**Nutchflow** is a full-stack, distributed web scraping and crawling application. It features a powerful Node.js backend leveraging Puppeteer and Cheerio for efficient data extraction, paired with a dynamic React frontend for intuitive data visualization and management.

---

## 🚀 Live Demo

**Check out the live application here:** [https://webcrawler-red.vercel.app/home](https://webcrawler-red.vercel.app/home)

---

## 🛠️ Features

- **🌐 Distributed Crawling:** Built on a scalable worker model to efficiently process large scraping jobs concurrently.
- **📊 Data Visualization:** Interactive charts and comprehensive data representation utilizing `D3.js` and `Recharts` on the frontend.
- **⚡ Real-time Updates:** Integrated with `Socket.io` to provide real-time, live notifications of crawling progress directly in the UI.
- **🧠 AI Integration:** Leverages Google's Generative AI to perform advanced data processing, summarization, and insight extraction.

## 🏗️ Project Structure

The project is structured as a monorepo, divided into two main components:

- `backend/`: The Node.js server handling API requests, scheduling tasks, communicating with AI models, and orchestrating web crawling operations.
- `frontend/`: The React (Vite) single-page application providing a modern and responsive user interface.

## ⚙️ Tech Stack

- **Frontend:** React, Vite, D3.js, Recharts, Socket.io-client
- **Backend:** Node.js, Express, Puppeteer, Cheerio, Socket.io, Google Generative AI
- **Database:** MongoDB & Mongoose

## 🏁 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A running instance of **MongoDB** (the backend requires Mongoose to connect to your database)

### Installation

To install dependencies for both the backend and frontend simultaneously, simply run the following command from the root directory:

```bash
npm run install:all
```

### Running the Application Locally

You can spin up both the frontend and backend concurrently using a single command from the root directory:

```bash
npm run dev
```

This command will start:
- The backend server on its designated port, connecting to MongoDB.
- The frontend Vite development server for an instant development experience.

## 📜 License

Private Project.
