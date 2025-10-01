const EvaluationResult = require('../../domain/evaluation/EvaluationResult');

class EvaluationProcessor {
  constructor(jobRepository, evaluator) {
    this.jobRepository = jobRepository;
    this.evaluator = evaluator;
  }

  async process(job) {
    job.markProcessing();
    job.incrementAttempts();
    await this.jobRepository.update(job);

    try {
      const rawResult = await this.evaluator.evaluate(job.request);
      const domainResult = new EvaluationResult({
        technicalScore: rawResult.technical_score,
        softskillScore: rawResult.softskill_score,
        strengths: rawResult.strengths,
        weaknesses: rawResult.weaknesses,
        summary: rawResult.summary,
        decision: rawResult.decision
      });

      job.markCompleted(domainResult);
      await this.jobRepository.update(job);
      return job;
    } catch (error) {
      job.markError(error.message || 'Unknown error');
      await this.jobRepository.update(job);
      return job;
    }
  }
}

module.exports = EvaluationProcessor;
