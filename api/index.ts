import express from "express";
import { registerRoutes } from "../server/routes";

// Create an Express app without calling listen().
// Vercel will treat the exported app as the request handler.
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
// Note: We don't need to serve the client here; Vercel will serve static files from dist/public via vercel.json routes.
(async () => {
  await registerRoutes(app);
})();

export default app;


