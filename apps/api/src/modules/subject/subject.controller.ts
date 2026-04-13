import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('subjects')
@UseGuards(AuthGuard)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async getAllSubjects() {
    const subjects = await this.subjectService.findAll();
    return { success: true, data: subjects };
  }

  @Get(':id/roadmap')
  async getSubjectRoadmap(@Param('id') id: string) {
    const roadmap = await this.subjectService.getRoadmap(id);
    return { success: true, data: roadmap };
  }

  /** GET /subjects/:id/roadmap-mastery — roadmap enriched with user's mastery data */
  @Get(':id/roadmap-mastery')
  async getRoadmapWithMastery(@Param('id') id: string, @Req() req: any) {
    const data = await this.subjectService.getRoadmapWithMastery(id, req.user.sub);
    return { success: true, data };
  }
}
