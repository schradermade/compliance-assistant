export interface Env {}

interface QueueMessage {
  ack: () => void;
}

interface QueueBatch {
  messages: QueueMessage[];
}

export default {
  async queue(batch: QueueBatch, _env: Env): Promise<void> {
    for (const message of batch.messages) {
      message.ack();
    }
  },
};
