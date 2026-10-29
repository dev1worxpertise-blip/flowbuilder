import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { authenticateToken, requireAdmin, AuthRequest } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";

export const adminRouter = Router();

// Apply auth + requireAdmin to all admin endpoints
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// System overview stats
adminRouter.get("/stats", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalDiagrams, totalActivities, recentActivities] = await Promise.all([
      prisma.user.count(),
      prisma.diagram.count(),
      prisma.activity.count(),
      prisma.activity.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24h
          },
        },
      }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalDiagrams,
        totalActivities,
        recentActivities24h: recentActivities,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// List all users with summary stats
adminRouter.get("/users", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            diagrams: true,
            activities: true,
          },
        },
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Failed to fetch users list" });
  }
});

// List all user activities (Audit Log)
adminRouter.get("/activities", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const userId = req.query.userId as string | undefined;

    const activities = await prisma.activity.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({ activities });
  } catch (error) {
    console.error("Admin activities error:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// List all system diagrams across all users
adminRouter.get("/diagrams", async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const diagrams = await prisma.diagram.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ diagrams });
  } catch (error) {
    console.error("Admin diagrams error:", error);
    res.status(500).json({ error: "Failed to fetch system diagrams" });
  }
});

// Update user role (promote to ADMIN / demote to USER)
adminRouter.put("/users/:id/role", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "USER" && role !== "ADMIN") {
      res.status(400).json({ error: "Role must be USER or ADMIN" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    await logActivity(
      req.userId!,
      "USER_ROLE_CHANGED",
      `Changed role of ${updatedUser.name} (${updatedUser.email}) to ${role}`,
      req.ip
    );

    res.json({ user: updatedUser });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// Create new user (Admin provision)
adminRouter.post("/users", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = "USER" } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    if (role !== "USER" && role !== "ADMIN") {
      res.status(400).json({ error: "Role must be USER or ADMIN" });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await logActivity(
      req.userId!,
      "USER_CREATED_BY_ADMIN",
      `Admin created user ${newUser.name} (${newUser.email}) with role ${role}`,
      req.ip
    );

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Admin set/reset password for a user
adminRouter.put("/users/:id/password", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await logActivity(
      req.userId!,
      "USER_PASSWORD_RESET_BY_ADMIN",
      `Admin reset password for user ${targetUser.name} (${targetUser.email})`,
      req.ip
    );

    res.json({ message: `Password updated successfully for ${targetUser.name}` });
  } catch (error) {
    console.error("Admin reset user password error:", error);
    res.status(500).json({ error: "Failed to reset user password" });
  }
});
