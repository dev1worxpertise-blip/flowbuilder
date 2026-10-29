import { prisma } from "../prisma.js";

export async function logActivity(userId: string, action: string, details?: string, ipAddress?: string): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        action,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
