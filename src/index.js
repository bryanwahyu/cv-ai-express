require('dotenv').config();

const SubmitEvaluationUseCase = require('./application/useCases/SubmitEvaluationUseCase');
const GetEvaluationResultUseCase = require('./application/useCases/GetEvaluationResultUseCase');
const EvaluationProcessor = require('./application/services/EvaluationProcessor');
const InMemoryJobRepository = require('./infrastructure/persistence/InMemoryJobRepository');
const InMemoryJobQueue = require('./infrastructure/queue/InMemoryJobQueue');
const OpenRouterEvaluator = require('./infrastructure/llm/OpenRouterEvaluator');
const createServer = require('./interfaces/http/createServer');

const jobRepository = new InMemoryJobRepository();
const evaluator = new OpenRouterEvaluator();
const processor = new EvaluationProcessor(jobRepository, evaluator);
const jobQueue = new InMemoryJobQueue(jobRepository, processor);

const submitEvaluationUseCase = new SubmitEvaluationUseCase(jobRepository, jobQueue);
const getEvaluationResultUseCase = new GetEvaluationResultUseCase(jobRepository);

const app = createServer({ submitEvaluationUseCase, getEvaluationResultUseCase });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Candidate evaluator API running on port ${port}`);
});

module.exports = { app, server };
