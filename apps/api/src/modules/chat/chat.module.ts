import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiModule } from '../ai/ai.module';
import { ProgressModule } from '../progress/progress.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AiModule, ProgressModule, NotificationModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
