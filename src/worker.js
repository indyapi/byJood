import { handleQueueBatch } from "./consumer.js";
import { enqueueDuePosts } from "./enqueue.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";

import openNextWorker from "../.open-next/worker.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/__cron" && request.method === "POST") {
      const result = await enqueueDuePosts(env);
      return Response.json(result);
    }
    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(enqueueDuePosts(env));
  },

  async queue(batch, env, ctx) {
    await handleQueueBatch(batch, env);
  },
};
