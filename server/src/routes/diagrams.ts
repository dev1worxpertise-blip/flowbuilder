import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";

export const diagramsRouter = Router();

// Public share endpoint - no authentication required!
diagramsRouter.get("/share/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const diagram = await prisma.diagram.findUnique({
      where: { id },
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

    if (!diagram) {
      res.status(404).json({ error: "Diagram not found" });
      return;
    }

    res.json({ diagram });
  } catch (error) {
    console.error("Public share error:", error);
    res.status(500).json({ error: "Failed to fetch shared diagram" });
  }
});

// Apply auth to all subsequent diagram endpoints
diagramsRouter.use(authenticateToken);

// List diagrams belonging to the current user
diagramsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const diagrams = await prisma.diagram.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        theme: true,
        thumbnail: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ diagrams });
  } catch (error) {
    console.error("List diagrams error:", error);
    res.status(500).json({ error: "Failed to fetch diagrams" });
  }
});

// Get a single diagram by ID (owner, public, or admin)
diagramsRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const diagram = await prisma.diagram.findUnique({
      where: { id },
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

    if (!diagram) {
      res.status(404).json({ error: "Diagram not found" });
      return;
    }

    const isOwner = diagram.userId === req.userId;
    const isAdmin = req.userRole === "ADMIN";

    if (!isOwner && !diagram.isPublic && !isAdmin) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ diagram });
  } catch (error) {
    console.error("Get diagram error:", error);
    res.status(500).json({ error: "Failed to fetch diagram" });
  }
});

// Create a new diagram
diagramsRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, name, nodes, edges, theme, thumbnail } = req.body;

    const diagram = await prisma.diagram.create({
      data: {
        ...(id ? { id } : {}),
        name: name || "Untitled Flow",
        nodes: nodes ?? [],
        edges: edges ?? [],
        theme: theme || "dark",
        thumbnail: thumbnail || null,
        userId: req.userId!,
      },
    });

    await logActivity(req.userId!, "DIAGRAM_CREATED", `Created diagram "${diagram.name}"`, req.ip);

    res.status(201).json({ diagram });
  } catch (error) {
    console.error("Create diagram error:", error);
    res.status(500).json({ error: "Failed to create diagram" });
  }
});

// Update an existing diagram
diagramsRouter.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, nodes, edges, theme, thumbnail, isPublic } = req.body;

    const existing = await prisma.diagram.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Diagram not found" });
      return;
    }

    const isOwner = existing.userId === req.userId;
    const isAdmin = req.userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "You do not have permission to edit this diagram" });
      return;
    }

    const updated = await prisma.diagram.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nodes !== undefined ? { nodes } : {}),
        ...(edges !== undefined ? { edges } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(thumbnail !== undefined ? { thumbnail } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
      },
    });

    await logActivity(req.userId!, "DIAGRAM_UPDATED", `Updated diagram "${updated.name}"`, req.ip);

    res.json({ diagram: updated });
  } catch (error) {
    console.error("Update diagram error:", error);
    res.status(500).json({ error: "Failed to update diagram" });
  }
});

// Delete a diagram
diagramsRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.diagram.findUnique({
      where: { id },
      select: { userId: true, name: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Diagram not found" });
      return;
    }

    const isOwner = existing.userId === req.userId;
    const isAdmin = req.userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "You do not have permission to delete this diagram" });
      return;
    }

    await prisma.diagram.delete({
      where: { id },
    });

    await logActivity(req.userId!, "DIAGRAM_DELETED", `Deleted diagram "${existing.name}"`, req.ip);

    res.json({ message: "Diagram deleted successfully" });
  } catch (error) {
    console.error("Delete diagram error:", error);
    res.status(500).json({ error: "Failed to delete diagram" });
  }
});

// Toggle diagram share status
diagramsRouter.patch("/:id/share", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const existing = await prisma.diagram.findUnique({
      where: { id },
      select: { userId: true, name: true, isPublic: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Diagram not found" });
      return;
    }

    const isOwner = existing.userId === req.userId;
    const isAdmin = req.userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const nextStatus = typeof isPublic === "boolean" ? isPublic : !existing.isPublic;

    const diagram = await prisma.diagram.update({
      where: { id },
      data: { isPublic: nextStatus },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await logActivity(
      req.userId!,
      "DIAGRAM_UPDATED",
      `Changed public share status of "${diagram.name}" to ${nextStatus ? "Public" : "Private"}`,
      req.ip
    );

    res.json({ diagram });
  } catch (error) {
    console.error("Toggle share error:", error);
    res.status(500).json({ error: "Failed to update share status" });
  }
});
