import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint for Anton to poll or receive task notifications
// GET /api/tasks/pending?agent=anton
http.route({
  path: "/api/tasks/pending",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const agent = url.searchParams.get("agent") || "anton";
    const tasks = await ctx.runQuery(api.agentTasks.pending, { assignedTo: agent });
    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Webhook endpoint to receive task completions from Anton
// POST /api/tasks/complete { taskId, result }
http.route({
  path: "/api/tasks/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { taskId, result } = body;
    if (!taskId || !result) {
      return new Response(JSON.stringify({ error: "taskId and result required" }), { status: 400 });
    }
    await ctx.runMutation(api.agentTasks.complete, { taskId, result });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
