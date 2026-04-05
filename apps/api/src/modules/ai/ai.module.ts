import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
