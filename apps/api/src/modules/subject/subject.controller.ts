import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
}
