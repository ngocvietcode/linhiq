import { Module } from '@nestjs/common';
import { TextbookController } from './textbook.controller';
import { TextbookService } from './textbook.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TextbookController],
  providers: [TextbookService],
  exports: [TextbookService],
})
export class TextbookModule {}
