const JobRepository = require('../../domain/jobs/JobRepository');

class InMemoryJobRepository extends JobRepository {
  constructor() {
    super();
    this.jobs = new Map();
  }

  async save(job) {
    this.jobs.set(job.id, job);
    return job;
  }

  async findById(id) {
    return this.jobs.get(id) || null;
  }

  async update(job) {
    if (!this.jobs.has(job.id)) {
      throw new Error(`Job ${job.id} not found`);
    }
    this.jobs.set(job.id, job);
    return job;
  }
}

module.exports = InMemoryJobRepository;
