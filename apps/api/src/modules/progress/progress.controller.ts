import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('progress')
@UseGuards(AuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('subjects')
  async getSubjects() {
    return this.progress.getSubjects();
  }

  @Get('overview')
  async getProgress(@Req() req: any) {
    return await this.progress.getOverview(req.user.sub);
  }
}
