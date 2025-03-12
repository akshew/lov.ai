import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Setup session middleware
app.use(
  session({
    secret: "ai-companion-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true, // Prevents client-side access to cookies
      sameSite: "lax", // Allows session persistence
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ✅ Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// ✅ Register API Routes
(async () => {
  const server = await registerRoutes(app);

  // ✅ Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // ✅ Serve frontend & setup Vite for development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();
