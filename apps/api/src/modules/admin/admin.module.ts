import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSubjectsController } from './admin-subjects.controller';
import { AdminSubjectsService } from './admin-subjects.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminSessionsController } from './admin-sessions.controller';
import { AdminSessionsService } from './admin-sessions.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  controllers: [
    AdminController,
    AdminSubjectsController,
    AdminUsersController,
    AdminSessionsController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminService,
    AdminSubjectsService,
    AdminUsersService,
    AdminSessionsService,
    AdminAnalyticsService,
  ],
  exports: [
    AdminService,
    AdminSubjectsService,
    AdminUsersService,
    AdminSessionsService,
    AdminAnalyticsService,
  ],
})
export class AdminModule {}
