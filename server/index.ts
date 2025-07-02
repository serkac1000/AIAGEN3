import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { execSync } from "child_process";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug middleware to log all incoming requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  log(`[DEBUG] Incoming request: ${req.method} ${req.url} Body: ${JSON.stringify(req.body)}`);

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `[DEBUG] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }
    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }
    log(logLine);
  });

  next();
});

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

// Register routes before Vite to ensure API precedence
(async () => {
  await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`[ERROR] ${status}: ${message}`);
    res.status(status).json({ message });
  });

  // Create HTTP server
  const server = createServer(app);

  // Vite setup for development (after API routes)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  server.listen(port, "127.0.0.1", () => {
    log(`[INFO] Server running on http://127.0.0.1:${port}`);
  });
})();