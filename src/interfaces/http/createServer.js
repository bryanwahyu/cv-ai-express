const express = require('express');
const multer = require('multer');
const SubmitEvaluationCommand = require('../../application/commands/SubmitEvaluationCommand');
const ValidationError = require('../../domain/errors/ValidationError');

function createServer({ submitEvaluationUseCase, getEvaluationResultUseCase }) {
  if (!submitEvaluationUseCase || !getEvaluationResultUseCase) {
    throw new Error('createServer requires both submitEvaluationUseCase and getEvaluationResultUseCase');
  }

  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024
    }
  });
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/evaluate', upload.fields([
    { name: 'cv_file', maxCount: 1 },
    { name: 'report_file', maxCount: 1 }
  ]), async (req, res, next) => {
    try {
      const { cv_text: inlineCvText, report_text: inlineReportText } = req.body || {};
      const cvFile = req.files?.cv_file?.[0];
      const reportFile = req.files?.report_file?.[0];

      if (cvFile && !cvFile.size) {
        throw new ValidationError('cv_file must not be empty');
      }

      if (reportFile && !reportFile.size) {
        throw new ValidationError('report_file must not be empty');
      }

      const cvText = cvFile ? cvFile.buffer.toString('utf8') : inlineCvText;
      const reportText = reportFile ? reportFile.buffer.toString('utf8') : inlineReportText;

      const command = new SubmitEvaluationCommand({ cvText, reportText });
      const job = await submitEvaluationUseCase.execute(command);

      res.status(202).json({
        job_id: job.id,
        status: job.status
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  app.get('/result/:id', async (req, res, next) => {
    try {
      const job = await getEvaluationResultUseCase.execute(req.params.id);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const view = job.toJSON();
      res.json({
        job_id: view.id,
        status: view.status,
        result: view.result,
        error: view.error
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Internal server error'
    });
  });

  return app;
}

module.exports = createServer;
