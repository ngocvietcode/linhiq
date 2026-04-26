import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  async list(@Req() req: RequestWithUser, @Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 20;
    return this.notifications.list(req.user.sub, n);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: RequestWithUser) {
    return this.notifications.unreadCount(req.user.sub);
  }

  @Patch(':id/read')
  async markRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    await this.notifications.markRead(req.user.sub, id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllRead(@Req() req: RequestWithUser) {
    await this.notifications.markAllRead(req.user.sub);
    return { success: true };
  }
}
