import { users, type User, type InsertUser, type JsonData, type InsertJsonData } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  storeJsonData(data: InsertJsonData): Promise<JsonData>;
  getJsonData(id: string): Promise<JsonData | undefined>;
  cleanupExpiredData(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jsonData: Map<string, JsonData>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.jsonData = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async storeJsonData(data: InsertJsonData): Promise<JsonData> {
    const jsonRecord: JsonData = {
      ...data,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
    };
    this.jsonData.set(data.id, jsonRecord);
    return jsonRecord;
  }

  async getJsonData(id: string): Promise<JsonData | undefined> {
    const jsonRecord = this.jsonData.get(id);

    // Check if data exists and hasn't expired
    if (jsonRecord && new Date() > jsonRecord.expiresAt) {
      // Data has expired, remove it and return undefined
      this.jsonData.delete(id);
      return undefined;
    }

    return jsonRecord;
  }

  async cleanupExpiredData(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    const entries = Array.from(this.jsonData.entries());
    for (const [id, jsonRecord] of entries) {
      if (now > jsonRecord.expiresAt) {
        this.jsonData.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

export const storage = new MemStorage();
