import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { ProgressService } from '../progress/progress.service';

// Weight multiplier: 1 quiz answer = QUIZ_WEIGHT chat answers for mastery
const QUIZ_WEIGHT = 2;

export interface GenerateQuizDto {
  type: 'topic' | 'milestone';
  id: string;           // topicId or milestoneId
  subjectId: string;
}

export interface SubmitAnswerDto {
  questionId: string;
  answer: string; // "A" | "B" | "C" | "D"
}

export interface SubmitQuizDto {
  answers: SubmitAnswerDto[];
}

@Injectable()
export class QuizService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ai: AiService,
    private readonly progress: ProgressService,
  ) {}

  /**
   * Generate a new quiz attempt (POST /quiz/generate)
   * - topic  → 5 questions, single topic
   * - milestone → 15 questions, ~3 per topic in milestone
   */
  async generateQuiz(userId: string, dto: GenerateQuizDto) {
    const { type, id, subjectId } = dto;

    // Resolve topic list
    let topics: { id: string; name: string }[];
    let milestoneId: string | undefined;
    let topicId: string | undefined;
    let questionCount: number;

    if (type === 'topic') {
      const topic = await this.db.topic.findUnique({ where: { id } });
      if (!topic) throw new NotFoundException('Topic not found');
      topics = [{ id: topic.id, name: topic.name }];
      topicId = topic.id;
      questionCount = 5;
    } else {
      const milestone = await this.db.milestone.findUnique({
        where: { id },
        include: { topics: { orderBy: { orderIndex: 'asc' } } },
      });
      if (!milestone) throw new NotFoundException('Milestone not found');
      if (milestone.topics.length === 0) throw new BadRequestException('Milestone has no topics');
      topics = milestone.topics.map(t => ({ id: t.id, name: t.name }));
      milestoneId = milestone.id;
      questionCount = 15;
    }

    // Resolve subject name for prompt
    const subject = await this.db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');

    // Generate questions via AI
    const generated = await this.ai.generateQuiz({
      topics,
      subjectName: subject.name,
      questionCount,
      subjectId,
    });

    // Create QuizAttempt + QuizQuestions in DB
    const attempt = await this.db.quizAttempt.create({
      data: {
        userId,
        subjectId,
        quizType: type === 'topic' ? 'TOPIC' : 'MILESTONE',
        ...(topicId && { topicId }),
        ...(milestoneId && { milestoneId }),
        total: generated.length,
        questions: {
          create: generated.map((q, i) => ({
            topicId: q.topicId,
            orderIndex: i,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    return {
      attemptId: attempt.id,
      quizType: attempt.quizType,
      total: attempt.total,
      questions: attempt.questions.map(q => ({
        id: q.id,
        orderIndex: q.orderIndex,
        question: q.question,
        options: q.options as string[],
        // Note: correctAnswer and explanation are NOT sent to frontend until submit
      })),
    };
  }

  /**
   * Submit answers and grade the quiz (POST /quiz/attempts/:id/submit)
   * Updates TopicProgress with quiz_weight = 2
   */
  async submitQuiz(userId: string, attemptId: string, dto: SubmitQuizDto) {
    const attempt = await this.db.quizAttempt.findUnique({
      where: { id: attemptId, userId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    if (attempt.completedAt) throw new BadRequestException('Quiz already submitted');

    const answerMap = new Map(dto.answers.map(a => [a.questionId, a.answer.toUpperCase()]));

    let correctCount = 0;
    const results: any[] = [];
    const masteryUpdates: { topicId: string; masteryLevel: number }[] = [];

    // Grade each question & update mastery
    const topicScores = new Map<string, { correct: number; total: number }>();

    for (const q of attempt.questions) {
      const studentAnswer = answerMap.get(q.id) ?? null;
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      // Aggregate per-topic for mastery update
      if (q.topicId) {
        const cur = topicScores.get(q.topicId) ?? { correct: 0, total: 0 };
        cur.total++;
        if (isCorrect) cur.correct++;
        topicScores.set(q.topicId, cur);
      }

      results.push({
        questionId: q.id,
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correctAnswer,
        studentAnswer,
        isCorrect,
        explanation: q.explanation,
      });

      // Persist student answer on each question
      await this.db.quizQuestion.update({
        where: { id: q.id },
        data: { studentAnswer, isCorrect },
      });
    }

    // Update mastery per topic (weight = QUIZ_WEIGHT)
    for (const [topicId, score] of topicScores.entries()) {
      for (let i = 0; i < score.total; i++) {
        const wasSuccessful = i < score.correct;
        const updated = await this.progress.updateTopicMastery(
          userId,
          topicId,
          wasSuccessful,
          QUIZ_WEIGHT,
        );
        // Only push last update (final mastery for this topic)
        if (i === score.total - 1) {
          masteryUpdates.push({ topicId, masteryLevel: updated.masteryLevel });
        }
      }
    }

    // Mark attempt complete
    await this.db.quizAttempt.update({
      where: { id: attemptId },
      data: { score: correctCount, completedAt: new Date() },
    });

    const pct = Math.round((correctCount / attempt.questions.length) * 100);
    const grade =
      pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Keep Practicing';

    return {
      attemptId,
      score: correctCount,
      total: attempt.questions.length,
      percentage: pct,
      grade,
      results,
      masteryUpdates,
    };
  }
}
