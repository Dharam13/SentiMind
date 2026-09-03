/**
 * RabbitMQ Celery Client for Collector Service
 * Dispatches mentions to Celery queue "sentiment_tasks" with graceful fallback.
 */

const amqp = require("amqplib");
const crypto = require("crypto");
const { logger } = require("../utils/logger");

const MODULE_NAME = "RabbitMQ";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672//";
const QUEUE_NAME = "sentiment_tasks";

let channel = null;
let connection = null;
let isConnected = false;

async function getChannel() {
  if (channel && isConnected) return channel;

  try {
    connection = await amqp.connect(RABBITMQ_URL, { timeout: 3000 });
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    isConnected = true;
    logger.info(MODULE_NAME, `Connected to RabbitMQ (Queue: ${QUEUE_NAME})`);

    connection.on("error", (err) => {
      logger.warn(MODULE_NAME, `RabbitMQ connection error: ${err.message}`);
      isConnected = false;
      channel = null;
    });

    connection.on("close", () => {
      logger.warn(MODULE_NAME, "RabbitMQ connection closed");
      isConnected = false;
      channel = null;
    });

    return channel;
  } catch (err) {
    logger.warn(MODULE_NAME, `RabbitMQ not reachable at ${RABBITMQ_URL} (${err.message}). Using HTTP fallback.`);
    isConnected = false;
    channel = null;
    return null;
  }
}

/**
 * Dispatch an individual mention to the Celery sentiment queue.
 */
async function dispatchMentionToCelery(mentionId, text, projectId = 1) {
  const ch = await getChannel();
  if (!ch) return false;

  const taskId = crypto.randomUUID();
  const celeryMessage = {
    id: taskId,
    task: "tasks.analyze_single_mention",
    args: [String(mentionId), text, projectId],
    kwargs: {},
    retries: 0,
    eta: null,
  };

  const published = ch.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(celeryMessage)),
    {
      persistent: true,
      contentType: "application/json",
      contentEncoding: "utf-8",
      headers: {
        task: "tasks.analyze_single_mention",
        id: taskId,
      },
    }
  );

  return published;
}

/**
 * Dispatch batch of mentions and schedule chord barrier callback.
 */
async function dispatchBatchToCelery(mentions, projectId = 1) {
  const ch = await getChannel();
  if (!ch || !mentions || mentions.length === 0) return false;

  let dispatched = 0;
  for (const m of mentions) {
    const text = m.content || m.metadata?.description || m.rawJson?.title || "";
    if (text) {
      await dispatchMentionToCelery(m._id, text, projectId);
      dispatched++;
    }
  }

  logger.info(MODULE_NAME, `Dispatched ${dispatched} mentions to Celery sentiment_tasks queue`);
  return true;
}

module.exports = {
  getChannel,
  dispatchMentionToCelery,
  dispatchBatchToCelery,
  isRabbitConnected: () => isConnected,
};
