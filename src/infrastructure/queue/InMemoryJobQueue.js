const debug = require('util').debuglog('queue');

class InMemoryJobQueue {
  constructor(jobRepository, processor) {
    this.jobRepository = jobRepository;
    this.processor = processor;
    this.queue = [];
    this.processing = false;
  }

  enqueue(job) {
    this.queue.push(job.id);
    debug('enqueued job %s (queue length: %d)', job.id, this.queue.length);
    this._schedule();
  }

  _schedule() {
    setImmediate(() => {
      this._processNext().catch((error) => {
        debug('queue processing error: %s', error.message);
      });
    });
  }

  async _processNext() {
    if (this.processing) {
      return;
    }

    const nextJobId = this.queue.shift();
    if (!nextJobId) {
      return;
    }

    const job = await this.jobRepository.findById(nextJobId);
    if (!job) {
      debug('job %s not found when processing', nextJobId);
      return this._schedule();
    }

    this.processing = true;

    try {
      await this.processor.process(job);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        this._schedule();
      }
    }
  }
}

module.exports = InMemoryJobQueue;
