const ValidationError = require('../errors/ValidationError');

class EvaluationRequest {
  constructor(cvText, reportText) {
    if (typeof cvText !== 'string' || typeof reportText !== 'string') {
      throw new ValidationError('cv_text and report_text must be strings');
    }

    const trimmedCv = cvText.trim();
    const trimmedReport = reportText.trim();

    if (!trimmedCv || !trimmedReport) {
      throw new ValidationError('cv_text and report_text must be non-empty');
    }

    this.cvText = trimmedCv;
    this.reportText = trimmedReport;
  }
}

module.exports = EvaluationRequest;
