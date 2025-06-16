import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJsonDataSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // JSON data storage endpoints
  app.post("/api/json", async (req, res) => {
    try {
      const validatedData = insertJsonDataSchema.parse(req.body);
      const storedData = await storage.storeJsonData(validatedData);
      res.json(storedData);
    } catch (error) {
      console.error("Error storing JSON data:", error);
      res.status(400).json({ error: "Invalid JSON data" });
    }
  });

  app.get("/api/json/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const jsonData = await storage.getJsonData(id);

      if (!jsonData) {
        return res.status(404).json({ error: "JSON data not found or expired" });
      }

      res.json(jsonData);
    } catch (error) {
      console.error("Error retrieving JSON data:", error);
      res.status(500).json({ error: "Failed to retrieve JSON data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
