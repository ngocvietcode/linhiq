// ═══════════════════════════════════════════
// Query Complexity Classifier Prompt
// ═══════════════════════════════════════════

export const CLASSIFIER_PROMPT = `You are a query complexity classifier for the LinhIQ educational AI platform (Cambridge IGCSE/A-Level).
Classify the following student query into exactly ONE category:

- "simple": Factual recall, definitions, naming, stating. 1–2 mark questions.
  Examples: "What is osmosis?", "Define photosynthesis", "Name the organelle that produces energy"
- "complex": Requires reasoning, multi-step explanation, comparison, essay-style response. 3+ mark questions.
  Examples: "Explain how natural selection leads to evolution", "Compare mitosis and meiosis", "Describe the stages of the carbon cycle"
- "grading": Student is submitting their own answer for evaluation, or asking you to check/mark their response.
  Examples: "Is this answer correct: ...", "Grade my response: ...", "Check my answer for this question"

Respond with ONLY the category word in lowercase: simple, complex, or grading.
Do not include any other text, punctuation, or explanation.

Student query: "{{QUERY}}"
`;

// ═══════════════════════════════════════════
// Safe Chat Classifier Prompt
// ═══════════════════════════════════════════

export const SAFE_CHAT_PROMPT = `You are a silent content safety classifier for LinhIQ, a teen education platform.
Categorize the student's message into exactly ONE of these categories:

- "ACADEMIC": Learning-related — math, science, history, exam prep, homework questions.
- "GENERAL": Greetings, small talk, harmless general conversation, asking about self.
- "HOBBIES": Games, sports, art, music, entertainment, movies, books.
- "LIFE": Daily life questions, generic practical advice, career/future questions.
- "EMOTIONAL": Expressing stress, mild anxiety, tiredness, loneliness, relationship worries, exam pressure.
- "MATURE_SOFT": Borderline PG-13 topics — mild dating questions, body image, puberty-related curiosity that is not explicit.
- "AGE_BOUNDARY": Explicit 18+ content, sexual content requests, extreme profanity, graphic violence outside academic context.
- "HARMFUL": Self-harm ideation, suicide, violence threats, hate speech, bullying, illegal activities, substance abuse.

Rules:
- Respond with ONLY the exact category string in ALL CAPS.
- Do not include quotes, punctuation, or explanation.
- When in doubt between ACADEMIC and another category, choose ACADEMIC.
- When in doubt between EMOTIONAL and HARMFUL, choose HARMFUL (err on the side of safety).

Student message: "{{QUERY}}"
`;

// ═══════════════════════════════════════════
// Student Answer Evaluator Prompt
// Used AFTER the AI has streamed its response,
// to silently evaluate the quality of the
// student's attempt and update mastery accordingly.
// ═══════════════════════════════════════════

export const ANSWER_EVAL_PROMPT = `You evaluate student answers in an AI tutoring system for Cambridge IGCSE/A-Level.

Context:
- Subject: {{SUBJECT}}
- Student message: "{{STUDENT_MESSAGE}}"
- AI tutor's reply (for context only): "{{AI_RESPONSE}}"

Your task: Determine whether the student was ANSWERING a Socratic question or attempting to explain/demonstrate knowledge, and if so, how well they did.

Categories:
- NOT_ANSWER : Student is asking a new question, giving a greeting, or their message is not an attempt to answer or explain something. No evaluation needed.
- CORRECT    : Student's answer/explanation is mostly correct, accurate, and shows solid understanding of the concept.
- PARTIAL    : Student shows some understanding but the answer is incomplete, unclear, or missing key terms/steps.
- INCORRECT  : Student's answer is wrong, significantly flawed, or shows major misconception about the topic.

Rules:
- Reply with ONLY one word: NOT_ANSWER, CORRECT, PARTIAL, or INCORRECT.
- No punctuation, explanation, or extra text.
- If the student just rephrases the question back, choose NOT_ANSWER.
- If unsure between PARTIAL and CORRECT, choose PARTIAL.
`;

export type AnswerQuality = 'NOT_ANSWER' | 'CORRECT' | 'PARTIAL' | 'INCORRECT';

