import { users, aiaProjects, type User, type InsertUser, type AiaProject, type InsertAiaProject } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createAiaProject(project: InsertAiaProject): Promise<AiaProject>;
  getAiaProject(id: number): Promise<AiaProject | undefined>;
  getAiaProjectsByUserId(userId: string): Promise<AiaProject[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private aiaProjects: Map<number, AiaProject>;
  private currentUserId: number;
  private currentProjectId: number;

  constructor() {
    this.users = new Map();
    this.aiaProjects = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
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
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAiaProject(insertProject: InsertAiaProject): Promise<AiaProject> {
    const id = this.currentProjectId++;
    const project: AiaProject = {
      ...insertProject,
      id,
      requirements: insertProject.requirements || null,
      extensions: insertProject.extensions || null,
      createdAt: new Date().toISOString(),
    };
    this.aiaProjects.set(id, project);
    return project;
  }

  async getAiaProject(id: number): Promise<AiaProject | undefined> {
    return this.aiaProjects.get(id);
  }

  async getAiaProjectsByUserId(userId: string): Promise<AiaProject[]> {
    return Array.from(this.aiaProjects.values()).filter(
      (project) => project.userId === userId
    );
  }
}

export const storage = new MemStorage();
