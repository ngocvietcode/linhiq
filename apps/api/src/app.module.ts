import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProgressModule } from './modules/progress/progress.module';
import { RagModule } from './modules/rag/rag.module';
import { AiModule } from './modules/ai/ai.module';

import { AdminModule } from './modules/admin/admin.module';
import { ParentModule } from './modules/parent/parent.module';
import { SubjectModule } from './modules/subject/subject.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { TextbookModule } from './modules/textbook/textbook.module';
import { UploadModule } from './modules/upload/upload.module';
import { SlidesModule } from './modules/slides/slides.module';
import { ReaderModule } from './modules/reader/reader.module';

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
    ParentModule,
    SubjectModule,
    QuizModule,
    TextbookModule,
    UploadModule,
    SlidesModule,
    ReaderModule,
  ],
})
export class AppModule {}
