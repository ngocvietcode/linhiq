import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSubjectsController } from './admin-subjects.controller';
import { AdminSubjectsService } from './admin-subjects.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [AdminController, AdminSubjectsController],
  providers: [AdminService, AdminSubjectsService],
  exports: [AdminService, AdminSubjectsService],
})
export class AdminModule {}
