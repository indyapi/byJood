import { handleQueueBatch } from "./consumer.js";
import { enqueueDuePosts } from "./enqueue.js";

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(enqueueDuePosts(env));
  },

  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      const result = await enqueueDuePosts(env);
      return Response.json(result);
    }
    return new Response("Use POST", { status: 405 });
  },

  async queue(batch, env, ctx) {
    await handleQueueBatch(batch, env);
  },
};
