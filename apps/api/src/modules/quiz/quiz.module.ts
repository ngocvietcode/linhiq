import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { AiModule } from '../ai/ai.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [AiModule, ProgressModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
