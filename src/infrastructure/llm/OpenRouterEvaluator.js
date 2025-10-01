const axios = require('axios');

class OpenRouterEvaluator {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    this.model = options.model || process.env.OPENROUTER_MODEL || 'gpt-4o-mini';
    this.timeout = Number(options.timeout || process.env.OPENROUTER_TIMEOUT_MS || 45000);
    this.siteUrl = options.siteUrl || process.env.OPENROUTER_SITE_URL || 'http://localhost';
    this.appName = options.appName || process.env.OPENROUTER_APP_NAME || 'Candidate Evaluator Service';
  }

  async evaluate(request) {
    const prompt = this._buildPrompt(request);
    const rawResponse = await this._callApi(prompt);

    let parsed;
    try {
      parsed = this._extractJson(rawResponse);
    } catch (primaryError) {
      const trimmed = rawResponse.replace(/^[^\{]*/, '').replace(/[^\}]*$/, '');
      parsed = this._extractJson(trimmed);
    }

    return this._validate(parsed);
  }

  _buildPrompt(request) {
    const instructions = `You are a technical evaluator for backend software engineers. Evaluate the candidate based on the provided CV and study case report. Respond ONLY with valid JSON following this schema:\n{\n  "technical_score": 0-100,\n  "softskill_score": 0-100,\n  "strengths": [string],\n  "weaknesses": [string],\n  "summary": string,\n  "decision": "Hire" | "Maybe" | "Reject"\n}\nBe objective, concise, and reference missing information as applicable.`;

    return `${instructions}\n\n# Candidate CV\n${request.cvText}\n\n# Case Study Submission\n${request.reportText}`;
  }

  async _callApi(prompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.siteUrl,
      'X-Title': this.appName
    };

    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an impartial backend engineering recruiter. Always respond with strict JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    };

    let data;
    try {
      ({ data } = await axios.post(this.apiUrl, payload, {
        headers,
        timeout: this.timeout
      }));
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const detail = typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data || {});
        throw new Error(`OpenRouter API error (${status}): ${detail}`);
      }
      if (error.request) {
        throw new Error('No response received from OpenRouter API');
      }
      throw new Error(`Failed to call OpenRouter API: ${error.message}`);
    }

    const messageContent = data?.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error('LLM response did not include content');
    }

    if (Array.isArray(messageContent)) {
      return messageContent.map((item) => item?.text || '').join('').trim();
    }

    if (typeof messageContent === 'string') {
      return messageContent.trim();
    }

    throw new Error('Unexpected LLM response shape');
  }

  _extractJson(text) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('LLM returned empty response');
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      const fallbackMatch = text.match(/\{[\s\S]*\}/);
      if (fallbackMatch) {
        return JSON.parse(fallbackMatch[0]);
      }
      throw new Error('LLM response was not valid JSON');
    }
  }

  _validate(result) {
    if (typeof result !== 'object' || result === null || Array.isArray(result)) {
      throw new Error('Parsed LLM response is not an object');
    }

    const requiredKeys = [
      'technical_score',
      'softskill_score',
      'strengths',
      'weaknesses',
      'summary',
      'decision'
    ];

    for (const key of requiredKeys) {
      if (!(key in result)) {
        throw new Error(`Missing required key "${key}" in LLM response`);
      }
    }

    const numericKeys = ['technical_score', 'softskill_score'];
    for (const key of numericKeys) {
      const value = Number(result[key]);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        throw new Error(`Key "${key}" must be a number between 0 and 100`);
      }
      result[key] = Math.round(value);
    }

    const arrayKeys = ['strengths', 'weaknesses'];
    for (const key of arrayKeys) {
      if (!Array.isArray(result[key])) {
        throw new Error(`Key "${key}" must be an array`);
      }
      result[key] = result[key].map((entry) => String(entry));
    }

    result.summary = String(result.summary || '');

    const allowedDecisions = new Set(['Hire', 'Maybe', 'Reject']);
    if (!allowedDecisions.has(result.decision)) {
      throw new Error('Decision must be one of: Hire, Maybe, Reject');
    }

    return result;
  }
}

module.exports = OpenRouterEvaluator;
