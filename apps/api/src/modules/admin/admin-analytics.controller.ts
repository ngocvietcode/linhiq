import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

type Period = '7d' | '30d' | 'all';

@Controller('admin/analytics')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('overview')
  async overview(@Query('period') period?: string) {
    const p: Period = period === '30d' || period === 'all' ? period : '7d';
    return this.analytics.overview(p);
  }

  @Get('chat-categories')
  async chatCategories() {
    return this.analytics.chatCategories();
  }
}
