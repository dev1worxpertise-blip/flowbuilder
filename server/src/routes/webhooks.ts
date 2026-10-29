import { Router, Request, Response } from "express";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export const webhooksRouter = Router();

export type NodeHealthStatus = "healthy" | "warning" | "down" | "pending";

export interface WebhookEventRecord {
  id: string;
  diagramId: string;
  nodeId: string;
  status: NodeHealthStatus;
  metric?: string;
  message?: string;
  source: "webhook" | "probe" | "manual";
  timestamp: string;
}

// In-memory ring buffer of recent events per diagram (last 50 events)
const recentEventsByDiagram = new Map<string, WebhookEventRecord[]>();

// Active Server-Sent Event (SSE) client response streams grouped by diagramId
const sseClientsByDiagram = new Map<string, Set<Response>>();

function broadcastToDiagram(diagramId: string, event: WebhookEventRecord) {
  // Store in ring buffer
  const list = recentEventsByDiagram.get(diagramId) || [];
  list.unshift(event);
  if (list.length > 50) list.pop();
  recentEventsByDiagram.set(diagramId, list);

  // Broadcast to all connected SSE clients
  const clients = sseClientsByDiagram.get(diagramId);
  if (clients && clients.size > 0) {
    const payload = `event: webhook_event\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
      try {
        client.write(payload);
      } catch (err) {
        console.error("Error writing to SSE client:", err);
      }
    }
  }
}

/**
 * 1. Primary Node Webhook Receiver
 * POST /api/webhooks/nodes/:diagramId/:nodeId
 */
webhooksRouter.post("/nodes/:diagramId/:nodeId", (req: Request, res: Response): void => {
  try {
    const { diagramId, nodeId } = req.params;
    const { status, metric, message, source } = req.body || {};

    const validStatuses: NodeHealthStatus[] = ["healthy", "warning", "down", "pending"];
    const healthStatus: NodeHealthStatus = validStatuses.includes(status) ? status : "healthy";

    const event: WebhookEventRecord = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      diagramId,
      nodeId,
      status: healthStatus,
      metric: typeof metric === "string" ? metric.trim() : undefined,
      message: typeof message === "string" ? message.trim() : undefined,
      source: source === "probe" ? "probe" : source === "manual" ? "manual" : "webhook",
      timestamp: new Date().toISOString(),
    };

    broadcastToDiagram(diagramId, event);

    res.status(200).json({
      success: true,
      message: `Webhook received for node ${nodeId}`,
      event,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

/**
 * 2. Universal Batch / Ingest Endpoint
 * POST /api/webhooks/ingest
 */
webhooksRouter.post("/ingest", (req: Request, res: Response): void => {
  try {
    const { diagramId, nodeId, status, metric, message, source } = req.body || {};

    if (!diagramId || !nodeId) {
      res.status(400).json({ error: "Missing required fields: diagramId and nodeId" });
      return;
    }

    const validStatuses: NodeHealthStatus[] = ["healthy", "warning", "down", "pending"];
    const healthStatus: NodeHealthStatus = validStatuses.includes(status) ? status : "healthy";

    const event: WebhookEventRecord = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      diagramId,
      nodeId,
      status: healthStatus,
      metric: typeof metric === "string" ? metric.trim() : undefined,
      message: typeof message === "string" ? message.trim() : undefined,
      source: source === "probe" ? "probe" : source === "manual" ? "manual" : "webhook",
      timestamp: new Date().toISOString(),
    };

    broadcastToDiagram(diagramId, event);

    res.status(200).json({
      success: true,
      message: `Webhook ingested for node ${nodeId}`,
      event,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    res.status(500).json({ error: "Failed to ingest webhook" });
  }
});

/**
 * 3. Server-Sent Events (SSE) Stream
 * GET /api/webhooks/stream/:diagramId
 */
webhooksRouter.get("/stream/:diagramId", (req: Request, res: Response): void => {
  const { diagramId } = req.params;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", diagramId, time: new Date().toISOString() })}\n\n`);

  if (!sseClientsByDiagram.has(diagramId)) {
    sseClientsByDiagram.set(diagramId, new Set());
  }
  const clientSet = sseClientsByDiagram.get(diagramId)!;
  clientSet.add(res);

  const heartbeatTimer = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeatTimer);
    clientSet.delete(res);
    if (clientSet.size === 0) {
      sseClientsByDiagram.delete(diagramId);
    }
  });
});

/**
 * 4. Recent Events History
 * GET /api/webhooks/events/:diagramId
 */
webhooksRouter.get("/events/:diagramId", (req: Request, res: Response): void => {
  const { diagramId } = req.params;
  const events = recentEventsByDiagram.get(diagramId) || [];
  res.json({ events });
});

/**
 * 5. Synthetic HTTP Ping Probe
 * POST /api/webhooks/probe
 */
webhooksRouter.post("/probe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { url: targetUrl } = req.body || {};
    if (!targetUrl || typeof targetUrl !== "string") {
      res.status(400).json({ error: "Missing or invalid 'url' parameter" });
      return;
    }

    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      res.status(400).json({ error: "Only http and https protocols are supported" });
      return;
    }

    const startTime = Date.now();
    const client = parsed.protocol === "https:" ? https : http;

    const request = client.request(
      targetUrl,
      {
        method: "HEAD",
        timeout: 8000,
        headers: { "User-Agent": "FlowBuilder-NOC-Probe/1.0" },
      },
      (probeRes) => {
        const latencyMs = Date.now() - startTime;
        const statusCode = probeRes.statusCode || 0;
        const isOk = statusCode >= 200 && statusCode < 400;

        let status: NodeHealthStatus = "healthy";
        if (statusCode >= 500 || statusCode === 0) {
          status = "down";
        } else if (statusCode >= 400 || latencyMs > 800) {
          status = "warning";
        }

        res.json({
          ok: isOk,
          statusCode,
          latencyMs,
          status,
          metric: `${latencyMs}ms (${statusCode})`,
          message: isOk ? `Endpoint responded with HTTP ${statusCode}` : `Endpoint returned error HTTP ${statusCode}`,
        });
      }
    );

    request.on("error", (err) => {
      const latencyMs = Date.now() - startTime;
      res.json({
        ok: false,
        statusCode: 0,
        latencyMs,
        status: "down" as NodeHealthStatus,
        metric: "Connection Refused",
        message: err.message || "Failed to reach host",
      });
    });

    request.on("timeout", () => {
      request.destroy();
      res.json({
        ok: false,
        statusCode: 408,
        latencyMs: 8000,
        status: "down" as NodeHealthStatus,
        metric: "Timeout (>8s)",
        message: "Request timed out after 8000ms",
      });
    });

    request.end();
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Invalid probe request" });
  }
});
