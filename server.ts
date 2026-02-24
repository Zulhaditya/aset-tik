import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- API ROUTES ---

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    };
  };

  // Logging Helper
  const logActivity = async (userId: string | null, action: string, entity: string, entityId?: string, details?: any) => {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  };

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "1d" });
    
    await logActivity(user.id, "LOGIN", "User");
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  });

  // Asset Routes
  app.get("/api/assets", authenticate, async (req, res) => {
    const assets = await prisma.asset.findMany({
      orderBy: { updatedAt: "desc" },
      include: { mutations: { take: 1, orderBy: { date: "desc" } } }
    });
    res.json(assets);
  });

  app.post("/api/assets", authenticate, authorize(["ADMIN", "OPERATOR"]), async (req, res) => {
    try {
      const asset = await prisma.asset.create({ data: req.body });
      await logActivity((req as any).user.id, "CREATE", "Asset", asset.id, asset);
      res.status(201).json(asset);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/assets/:id", authenticate, async (req, res) => {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        mutations: { include: { user: { select: { name: true } } }, orderBy: { date: "desc" } },
        maintenances: { orderBy: { date: "desc" } },
        loans: { include: { user: { select: { name: true } } }, orderBy: { loanDate: "desc" } }
      }
    });
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json(asset);
  });

  app.put("/api/assets/:id", authenticate, authorize(["ADMIN", "OPERATOR"]), async (req, res) => {
    try {
      const oldAsset = await prisma.asset.findUnique({ where: { id: req.params.id } });
      const asset = await prisma.asset.update({ where: { id: req.params.id }, data: req.body });
      await logActivity((req as any).user.id, "UPDATE", "Asset", asset.id, { old: oldAsset, new: asset });
      res.json(asset);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/assets/:id", authenticate, authorize(["ADMIN"]), async (req, res) => {
    try {
      await prisma.asset.delete({ where: { id: req.params.id } });
      await logActivity((req as any).user.id, "DELETE", "Asset", req.params.id);
      res.status(204).send();
    } catch (err: any) {
      console.error("Delete error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Mutation Routes
  app.post("/api/mutations", authenticate, authorize(["ADMIN", "OPERATOR"]), async (req, res) => {
    const { assetId, toLocation, description } = req.body;
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const mutation = await prisma.mutation.create({
      data: {
        assetId,
        fromLocation: asset.location,
        toLocation,
        description,
        userId: (req as any).user.id
      }
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { location: toLocation }
    });

    await logActivity((req as any).user.id, "MUTATION", "Asset", assetId, mutation);
    res.status(201).json(mutation);
  });

  // Dashboard Stats
  app.get("/api/stats", authenticate, async (req, res) => {
    const totalAssets = await prisma.asset.count();
    const assetsByStatus = await prisma.asset.groupBy({ by: ["status"], _count: true });
    const assetsByCategory = await prisma.asset.groupBy({ by: ["category"], _count: true });
    const recentLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { name: true } } }
    });

    // Service Reminders (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const reminders = await prisma.asset.findMany({
      where: {
        nextServiceDate: {
          lte: thirtyDaysFromNow,
          gte: new Date()
        }
      },
      select: { id: true, name: true, code: true, nextServiceDate: true }
    });

    res.json({ totalAssets, assetsByStatus, assetsByCategory, recentLogs, reminders });
  });

  // Maintenance Routes
  app.post("/api/maintenances", authenticate, authorize(["ADMIN", "OPERATOR"]), async (req, res) => {
    const { assetId, type, cost, description, performedBy, nextServiceDate } = req.body;
    const maintenance = await prisma.maintenance.create({
      data: { assetId, type, cost, description, performedBy }
    });

    if (nextServiceDate) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { nextServiceDate: new Date(nextServiceDate) }
      });
    }

    await logActivity((req as any).user.id, "MAINTENANCE", "Asset", assetId, maintenance);
    res.status(201).json(maintenance);
  });

  // Loan Routes
  app.post("/api/loans", authenticate, authorize(["ADMIN", "OPERATOR"]), async (req, res) => {
    const { assetId, borrowerName, borrowerDept, dueDate, notes } = req.body;
    
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== "AVAILABLE") {
      return res.status(400).json({ error: "Asset is not available for loan" });
    }

    const loan = await prisma.loan.create({
      data: {
        assetId,
        userId: (req as any).user.id,
        borrowerName,
        borrowerDept,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes
      }
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "LOANED" }
    });

    await logActivity((req as any).user.id, "LOAN_START", "Asset", assetId, loan);
    res.status(201).json(loan);
  });

  app.post("/api/loans/:id/return", authenticate, authorize(["ADMIN", "OPERATOR"]), async (req, res) => {
    const loan = await prisma.loan.findUnique({ where: { id: req.params.id } });
    if (!loan || loan.status !== "ACTIVE") {
      return res.status(400).json({ error: "Invalid loan record" });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: req.params.id },
      data: {
        status: "RETURNED",
        returnDate: new Date()
      }
    });

    await prisma.asset.update({
      where: { id: loan.assetId },
      data: { status: "AVAILABLE" }
    });

    await logActivity((req as any).user.id, "LOAN_RETURN", "Asset", loan.assetId, updatedLoan);
    res.json(updatedLoan);
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
