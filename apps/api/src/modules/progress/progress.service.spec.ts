import { ProgressService } from './progress.service';

/**
 * Unit tests for the mastery formula in ProgressService.
 *
 * Formula:
 *   accuracy   = correctAnswers / questionsAsked
 *   confidence = min(1, questionsAsked / MIN_QUESTIONS)    where MIN_QUESTIONS = 5
 *   mastery    = accuracy × confidence
 */
describe('ProgressService — updateTopicMastery', () => {
  let service: ProgressService;
  let mockDb: any;

  const userId = 'user-1';
  const topicId = 'topic-1';

  beforeEach(() => {
    mockDb = {
      topicProgress: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new ProgressService(mockDb, { create: jest.fn() } as any);
  });

  // Helper: simulate a sequence of answers and return the final mastery
  async function simulateAnswers(
    answers: { wasSuccessful: boolean; weight?: number }[],
  ): Promise<number> {
    let existing: { questionsAsked: number; correctAnswers: number; masteryLevel: number } | null = null;

    for (const { wasSuccessful, weight = 1 } of answers) {
      mockDb.topicProgress.findUnique.mockResolvedValue(existing);

      // Capture what would be written
      mockDb.topicProgress.upsert.mockImplementation((args: any) => {
        const questionsAsked =
          existing
            ? (existing.questionsAsked + weight)
            : weight;
        const correctAnswers =
          existing
            ? (existing.correctAnswers + (wasSuccessful ? weight : 0))
            : (wasSuccessful ? weight : 0);

        const MIN_QUESTIONS = 5;
        const confidence = Math.min(1.0, questionsAsked / MIN_QUESTIONS);
        const accuracy = correctAnswers / questionsAsked;
        const masteryLevel = Math.min(1.0, Math.max(0, accuracy * confidence));

        existing = { questionsAsked, correctAnswers, masteryLevel };
        return Promise.resolve(existing);
      });

      await service.updateTopicMastery(userId, topicId, wasSuccessful, weight);
    }

    return existing!.masteryLevel;
  }

  // ── Core formula tests ──

  it('first correct answer → mastery ≈ 20% (not 100%)', async () => {
    const mastery = await simulateAnswers([{ wasSuccessful: true }]);
    // 1/1 accuracy × 1/5 confidence = 0.2
    expect(mastery).toBeCloseTo(0.2, 2);
  });

  it('first incorrect answer → mastery = 0%', async () => {
    const mastery = await simulateAnswers([{ wasSuccessful: false }]);
    expect(mastery).toBe(0);
  });

  it('5 correct answers → mastery = 100% (MIN_QUESTIONS reached)', async () => {
    const answers = Array(5).fill({ wasSuccessful: true });
    const mastery = await simulateAnswers(answers);
    // 5/5 accuracy × 5/5 confidence = 1.0
    expect(mastery).toBeCloseTo(1.0, 2);
  });

  it('3 correct + 2 incorrect → mastery = 60%', async () => {
    const answers = [
      { wasSuccessful: true },
      { wasSuccessful: true },
      { wasSuccessful: true },
      { wasSuccessful: false },
      { wasSuccessful: false },
    ];
    const mastery = await simulateAnswers(answers);
    // 3/5 accuracy × 5/5 confidence = 0.6
    expect(mastery).toBeCloseTo(0.6, 2);
  });

  it('2 correct out of 5 → mastery = 40%', async () => {
    const answers = [
      { wasSuccessful: true },
      { wasSuccessful: true },
      { wasSuccessful: false },
      { wasSuccessful: false },
      { wasSuccessful: false },
    ];
    const mastery = await simulateAnswers(answers);
    // 2/5 × 1.0 = 0.4
    expect(mastery).toBeCloseTo(0.4, 2);
  });

  // ── Confidence scaling tests ──

  it('2 correct out of 2 → mastery = 40% (confidence not full yet)', async () => {
    const answers = [
      { wasSuccessful: true },
      { wasSuccessful: true },
    ];
    const mastery = await simulateAnswers(answers);
    // 2/2 accuracy × 2/5 confidence = 0.4
    expect(mastery).toBeCloseTo(0.4, 2);
  });

  it('mastery never exceeds 1.0', async () => {
    const answers = Array(10).fill({ wasSuccessful: true });
    const mastery = await simulateAnswers(answers);
    expect(mastery).toBeLessThanOrEqual(1.0);
    expect(mastery).toBeCloseTo(1.0, 2);
  });

  it('mastery never goes below 0', async () => {
    const answers = Array(5).fill({ wasSuccessful: false });
    const mastery = await simulateAnswers(answers);
    expect(mastery).toBe(0);
  });

  // ── Quiz weight tests ──

  it('quiz weight=2: 1 correct quiz answer counts as 2 chat answers', async () => {
    const mastery = await simulateAnswers([{ wasSuccessful: true, weight: 2 }]);
    // 2/2 accuracy × 2/5 confidence = 0.4
    expect(mastery).toBeCloseTo(0.4, 2);
  });

  it('quiz weight=2: 1 incorrect quiz answer → mastery = 0', async () => {
    const mastery = await simulateAnswers([{ wasSuccessful: false, weight: 2 }]);
    expect(mastery).toBe(0);
  });

  // ── DB interaction tests ──

  it('calls findUnique to check existing progress', async () => {
    mockDb.topicProgress.findUnique.mockResolvedValue(null);
    mockDb.topicProgress.upsert.mockResolvedValue({
      questionsAsked: 1,
      correctAnswers: 1,
      masteryLevel: 0.2,
    });

    await service.updateTopicMastery(userId, topicId, true);

    expect(mockDb.topicProgress.findUnique).toHaveBeenCalledWith({
      where: { userId_topicId: { userId, topicId } },
    });
  });

  it('calls upsert with correct create data for new progress', async () => {
    mockDb.topicProgress.findUnique.mockResolvedValue(null);
    mockDb.topicProgress.upsert.mockResolvedValue({
      questionsAsked: 1,
      correctAnswers: 1,
      masteryLevel: 0.2,
    });

    await service.updateTopicMastery(userId, topicId, true);

    expect(mockDb.topicProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_topicId: { userId, topicId } },
        create: expect.objectContaining({
          userId,
          topicId,
          questionsAsked: 1,
          correctAnswers: 1,
        }),
      }),
    );
  });
});

describe('ProgressService — getTopicIdFromChunks', () => {
  let service: ProgressService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      documentChunk: {
        findMany: jest.fn(),
      },
    };
    service = new ProgressService(mockDb, { create: jest.fn() } as any);
  });

  it('returns null for empty chunk IDs', async () => {
    const result = await service.getTopicIdFromChunks([]);
    expect(result).toBeNull();
  });

  it('returns null when no chunks have topicId', async () => {
    mockDb.documentChunk.findMany.mockResolvedValue([]);
    const result = await service.getTopicIdFromChunks(['chunk-1', 'chunk-2']);
    expect(result).toBeNull();
  });

  it('returns the most frequent topicId', async () => {
    mockDb.documentChunk.findMany.mockResolvedValue([
      { topicId: 'topic-a' },
      { topicId: 'topic-b' },
      { topicId: 'topic-a' },
    ]);
    const result = await service.getTopicIdFromChunks(['c1', 'c2', 'c3']);
    expect(result).toBe('topic-a');
  });
});
