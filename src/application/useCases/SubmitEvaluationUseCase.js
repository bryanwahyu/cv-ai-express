const EvaluationRequest = require('../../domain/evaluation/EvaluationRequest');
const EvaluationJob = require('../../domain/jobs/EvaluationJob');

class SubmitEvaluationUseCase {
  constructor(jobRepository, jobQueue) {
    this.jobRepository = jobRepository;
    this.jobQueue = jobQueue;
  }

  async execute(command) {
    const request = new EvaluationRequest(command.cvText, command.reportText);
    const job = new EvaluationJob({ request });

    await this.jobRepository.save(job);
    this.jobQueue.enqueue(job);

    return job;
  }
}

module.exports = SubmitEvaluationUseCase;
