"use strict";
// ═══════════════════════════════════════════
// Query Complexity Classifier Prompt
// ═══════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASSIFIER_PROMPT = void 0;
exports.CLASSIFIER_PROMPT = `You are a query complexity classifier for an educational AI platform.
Classify the following student query into exactly one category:

- "simple": Factual recall, definitions, yes/no questions. Examples: "What is osmosis?", "Define photosynthesis"
- "complex": Requires reasoning, multi-step explanation, essay-style answers, or comparing concepts. Examples: "Explain how natural selection leads to evolution", "Compare mitosis and meiosis"
- "grading": Student is submitting an answer for evaluation against a mark scheme. Examples: "Is this answer correct: ...", "Grade my response: ..."

Respond with ONLY the category word: simple, complex, or grading.

Student query: "{{QUERY}}"
`;
