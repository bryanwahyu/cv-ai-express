class EvaluationResult {
  constructor({ technicalScore, softskillScore, strengths, weaknesses, summary, decision }) {
    this.technicalScore = technicalScore;
    this.softskillScore = softskillScore;
    this.strengths = strengths;
    this.weaknesses = weaknesses;
    this.summary = summary;
    this.decision = decision;
  }

  toJSON() {
    return {
      technical_score: this.technicalScore,
      softskill_score: this.softskillScore,
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      summary: this.summary,
      decision: this.decision
    };
  }
}

module.exports = EvaluationResult;
