import { handleQueueBatch } from "./consumer.js";
import { handleDlqBatch } from "./dlq-consumer.js";
import { enqueueDuePosts } from "./enqueue.js";
import { refreshExpiringTokens } from "./refresh-tokens.js";

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
    if (event.cron === "0 3 * * *") {
      ctx.waitUntil(refreshExpiringTokens(env));
    }
  },

  async queue(batch, env, ctx) {
    if (batch.queue === "post-jobs-dlq") {
      await handleDlqBatch(batch, env);
    } else {
      await handleQueueBatch(batch, env);
    }
  },
};
