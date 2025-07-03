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
const port = 4000;
try {
  const netstatOutput = execSync(`netstat -aon | findstr :${port}`).toString();
  const lines = netstatOutput.split('\n').filter(line => line.includes(`:${port}`));
  if (lines.length > 0) {
    const pidMatch = lines[0].match(/\s+(\d+)\s*$/);
    if (pidMatch) {
      const pid = pidMatch[1];
      log(`Port ${port} is in use by PID ${pid}. Terminating process...`);
      execSync(`taskkill /PID ${pid} /F`);
      log(`Process ${pid} terminated.`);
    }
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
server.listen(port, "127.0.0.1", () => {
  log(`[INFO] Server running on http://127.0.0.1:${port}`);
});
