class GetEvaluationResultUseCase {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId) {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      return null;
    }

    return job;
  }
}

module.exports = GetEvaluationResultUseCase;
