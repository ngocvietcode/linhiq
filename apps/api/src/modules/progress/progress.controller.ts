import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('subjects')
  async getSubjects() {
    return this.progress.getSubjects();
  }

  @Get('overview')
  async getProgress(@Req() req: RequestWithUser) {
    return await this.progress.getOverview(req.user.sub);
  }

  @Get('chat-stats')
  async getChatStats(@Req() req: RequestWithUser, @Query('weeks') weeks?: string) {
    const w = weeks ? Math.min(12, Math.max(1, Number(weeks))) : 4;
    return this.progress.getChatCategoryStats(req.user.sub, w);
  }

  @Get('study-hours')
  async getStudyHours(@Req() req: RequestWithUser, @Query('days') days?: string) {
    const d = days ? Math.min(30, Math.max(1, Number(days))) : 7;
    return this.progress.getStudyHoursByDay(req.user.sub, d);
  }

  @Get('study-by-subject')
  async getStudyBySubject(@Req() req: RequestWithUser) {
    return this.progress.getStudyTimeBySubject(req.user.sub);
  }

  @Get('summary')
  async getSummary(@Req() req: RequestWithUser) {
    return this.progress.getQuestionsAndAccuracy(req.user.sub);
  }
}
