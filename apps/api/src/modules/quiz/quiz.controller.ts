import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { QuizService } from './quiz.service';
import type { GenerateQuizDto, SubmitQuizDto } from './quiz.service';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('quiz')
@UseGuards(AuthGuard)
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  /**
   * Generate a new quiz
   * POST /quiz/generate
   * Body: { type: "topic"|"milestone", id: string, subjectId: string }
   */
  @Post('generate')
  generate(@Req() req: RequestWithUser, @Body() dto: GenerateQuizDto) {
    return this.quiz.generateQuiz(req.user.sub, dto);
  }

  /**
   * Submit answers and get results + mastery update
   * POST /quiz/attempts/:attemptId/submit
   */
  @Post('attempts/:attemptId/submit')
  submit(
    @Req() req: RequestWithUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quiz.submitQuiz(req.user.sub, attemptId, dto);
  }
}
