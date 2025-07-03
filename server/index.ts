import express from "express";
import { aiaRouter } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { execSync } from "child_process";
import { createServer } from "http";

const app = express();
app.use(express.json());

// Use the AIA router
app.use("/api", aiaRouter);

// Check port and terminate conflicting process
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
try {
  const lsofOutput = execSync(`lsof -ti:${port}`).toString().trim();
  if (lsofOutput) {
    const pid = lsofOutput;
    log(`Port ${port} is in use by PID ${pid}. Terminating process...`);
    execSync(`kill -9 ${pid}`);
    log(`Process ${pid} terminated.`);
  }
} catch (error) {
  log(`No process found on port ${port}.`);
}

// Create HTTP server
const server = createServer(app);

// Vite setup for development (after API routes)
if (process.env.NODE_ENV === "development") {
  setupVite(app, server);
} else {
  serveStatic(app);
}

// Start server
server.listen(port, "0.0.0.0", () => {
  log(`[INFO] Server running on http://0.0.0.0:${port}`);
});
