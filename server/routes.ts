import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJsonDataSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // JSON data storage endpoints
  app.post("/api/json", async (req, res) => {
    try {
      console.log("=== POST /api/json ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Body type:", typeof req.body);
      console.log("Body keys:", Object.keys(req.body || {}));
      
      const validatedData = insertJsonDataSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      const storedData = await storage.storeJsonData(validatedData);
      console.log("Stored data response:", JSON.stringify(storedData, null, 2));
      
      res.json(storedData);
    } catch (error) {
      console.error("Error storing JSON data:", error);
      console.error("Error details:", error);
      res.status(400).json({ error: "Invalid JSON data" });
    }
  });

  app.get("/api/json/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("=== GET /api/json/:id ===");
      console.log("Requested ID:", id);
      console.log("ID type:", typeof id);
      console.log("ID length:", id.length);
      console.log("ID contains '[object Object]':", id.includes('[object Object]'));
      
      const jsonData = await storage.getJsonData(id);

      if (!jsonData) {
        console.log("JSON data not found for ID:", id);
        return res.status(404).json({ error: "JSON data not found or expired" });
      }

      console.log("Found JSON data for ID:", id);
      res.json(jsonData);
    } catch (error) {
      console.error("Error retrieving JSON data:", error);
      res.status(500).json({ error: "Failed to retrieve JSON data" });
    }
  });

  // Add a catch-all route to log any unusual requests
  app.get("*", (req, res, next) => {
    // Only log for paths that might be our JSON URLs or contain 'object'
    if (req.path.match(/^\/\d+/) || req.path.includes('object') || req.path.includes('[object')) {
      console.log("=== POTENTIAL JSON URL REQUEST ===");
      console.log("Request URL:", req.url);
      console.log("Request path:", req.path);
      console.log("Request params:", req.params);
      console.log("Request query:", req.query);
    }
    
    next();
  });

  const httpServer = createServer(app);

  return httpServer;
}
