import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const generateInterviewQuestions = async (preferences) => {
    const { jobRole, industry, experienceLevel } = preferences;

    const prompt = `You are an expert interview coach. Generate exactly 10 interview questions for a ${experienceLevel} ${jobRole} position in the ${industry} industry.

IMPORTANT: Return ONLY valid JSON, no markdown.

Return this exact structure:
{
  "questions": [
    {
      "question": "<interview question>",
      "type": "<behavioral/technical/situational/general>",
      "difficulty": "<easy/medium/hard>"
    }
  ]
}

Rules:
1. Mix question types: 3 behavioral, 3 technical, 2 situational, 2 general
2. Progress from easy to hard
3. Make questions specific to ${jobRole} role
4. Include industry-specific scenarios for ${industry}
5. Adjust complexity for ${experienceLevel} level`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return parsed.questions.slice(0, 10).map(q => ({
        questionId: generateQuestionId(),
        question: q.question,
        type: q.type,
        difficulty: q.difficulty
    }));
};

export const analyzeAnswer = async (question, transcript, duration) => {
    const prompt = `You are an expert interview coach analyzing a candidate's response.

Question: "${question}"
Candidate's Answer: "${transcript}"
Duration: ${duration} seconds

IMPORTANT: Return ONLY valid JSON.

Analyze and return:
{
  "relevance": <0-100 how relevant the answer is to the question>,
  "clarity": <0-100 how clear and well-structured>,
  "confidence": <0-100 based on language used>,
  "feedback": "<2-3 sentence constructive feedback>",
  "suggestions": ["<specific improvement 1>", "<improvement 2>"],
  "fillerWords": {
    "count": <number of filler words detected>,
    "words": ["<filler word 1>", "<filler word 2>"]
  },
  "idealAnswerPoints": ["<key point that should be mentioned>"]
}

Rules:
1. Be encouraging but honest
2. Provide actionable suggestions
3. Score fairly based on content quality
4. Detect filler words like "um", "uh", "like", "you know", "basically"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText);
};

export const generateOverallFeedback = async (interview) => {
    const answeredQuestions = interview.answers.length;
    const totalQuestions = interview.questions.length;

    const answersData = interview.answers.map((a, i) => ({
        question: a.question,
        relevance: a.analysis?.relevance || 0,
        clarity: a.analysis?.clarity || 0,
        confidence: a.analysis?.confidence || 0,
        expressionConfidence: a.expressionMetrics?.overallExpressionScore || 0
    }));

    const avgRelevance = answersData.reduce((sum, a) => sum + a.relevance, 0) / answersData.length || 0;
    const avgClarity = answersData.reduce((sum, a) => sum + a.clarity, 0) / answersData.length || 0;
    const avgConfidence = answersData.reduce((sum, a) => sum + a.confidence, 0) / answersData.length || 0;
    const avgExpression = answersData.reduce((sum, a) => sum + a.expressionConfidence, 0) / answersData.length || 0;

    const prompt = `You are a senior interview coach providing overall feedback.

Interview Performance Data:
- Questions Answered: ${answeredQuestions}/${totalQuestions}
- Average Relevance: ${avgRelevance.toFixed(1)}%
- Average Clarity: ${avgClarity.toFixed(1)}%
- Average Verbal Confidence: ${avgConfidence.toFixed(1)}%
- Average Expression Confidence: ${avgExpression.toFixed(1)}%
- Job Role: ${interview.jobRole}
- Experience Level: ${interview.experienceLevel}

IMPORTANT: Return ONLY valid JSON.

Return:
{
  "summary": "<3-4 sentence overall assessment>",
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<area 1>", "<area 2>", "<area 3>"],
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "expressionAnalysis": {
    "overallConfidence": ${avgExpression.toFixed(0)},
    "feedback": "<feedback on body language and confidence>"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const feedback = JSON.parse(cleanedText);

    const overallScore = Math.round((avgRelevance * 0.35) + (avgClarity * 0.25) + (avgConfidence * 0.2) + (avgExpression * 0.2));

    return {
        overallScore,
        overallFeedback: feedback
    };
};
