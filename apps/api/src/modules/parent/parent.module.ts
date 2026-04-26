import { Module } from '@nestjs/common';
import { ParentController } from './parent.controller';
import { ParentLinkController } from './parent-link.controller';
import { ParentService } from './parent.service';
import { ProgressModule } from '../progress/progress.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ProgressModule, NotificationModule],
  controllers: [ParentController, ParentLinkController],
  providers: [ParentService],
})
export class ParentModule {}
