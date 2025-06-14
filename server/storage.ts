import { users, type User, type InsertUser, type JsonData, type InsertJsonData } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  storeJsonData(data: InsertJsonData): Promise<JsonData>;
  getJsonData(id: string): Promise<JsonData | undefined>;
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
    };
    this.jsonData.set(data.id, jsonRecord);
    return jsonRecord;
  }

  async getJsonData(id: string): Promise<JsonData | undefined> {
    return this.jsonData.get(id);
  }
}

export const storage = new MemStorage();
