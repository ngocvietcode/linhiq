import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProgressModule } from './modules/progress/progress.module';
import { RagModule } from './modules/rag/rag.module';
import { AiModule } from './modules/ai/ai.module';

import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    AuthModule,
    RagModule,
    AiModule,
    ChatModule,
    ProgressModule,
    AdminModule,
  ],
})
export class AppModule {}
