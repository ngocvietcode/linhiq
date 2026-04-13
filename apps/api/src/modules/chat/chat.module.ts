import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiModule } from '../ai/ai.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [AiModule, ProgressModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
