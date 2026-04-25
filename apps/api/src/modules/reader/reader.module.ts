import { Module } from '@nestjs/common';
import { ReaderController } from './reader.controller';
import { ReaderService } from './reader.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReaderController],
  providers: [ReaderService],
  exports: [ReaderService],
})
export class ReaderModule {}
