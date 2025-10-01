const { v4: uuidv4 } = require('uuid');
const JobStatus = require('./JobStatus');

class EvaluationJob {
  constructor({ id = uuidv4(), request, status = JobStatus.PROCESSING, result = null, error = null, attempts = 0, createdAt = new Date(), updatedAt = new Date() }) {
    if (!request) {
      throw new Error('EvaluationJob requires a request');
    }

    this.id = id;
    this.request = request;
    this.status = status;
    this.result = result;
    this.error = error;
    this.attempts = attempts;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  markProcessing() {
    this.status = JobStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  markCompleted(result) {
    this.status = JobStatus.COMPLETED;
    this.result = result;
    this.error = null;
    this.updatedAt = new Date();
  }

  markError(errorMessage) {
    this.status = JobStatus.ERROR;
    this.error = errorMessage;
    this.updatedAt = new Date();
  }

  incrementAttempts() {
    this.attempts += 1;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      result: this.result ? this.result.toJSON() : null,
      error: this.error,
      attempts: this.attempts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = EvaluationJob;
