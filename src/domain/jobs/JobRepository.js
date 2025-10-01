class JobRepository {
  async save(_job) {
    throw new Error('JobRepository.save must be implemented');
  }

  async findById(_id) {
    throw new Error('JobRepository.findById must be implemented');
  }

  async update(_job) {
    throw new Error('JobRepository.update must be implemented');
  }
}

module.exports = JobRepository;
