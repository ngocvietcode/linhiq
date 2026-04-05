import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminSubjectsService } from './admin-subjects.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Curriculum } from '@prisma/client';

@Controller('admin/subjects')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSubjectsController {
  constructor(private readonly service: AdminSubjectsService) {}

  @Get()
  async getAll() {
    const subjects = await this.service.getAllSubjects();
    return { success: true, data: subjects };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const subject = await this.service.getSubject(id);
    return { success: true, data: subject };
  }

  @Post()
  async create(@Body() data: { name: string; curriculum: Curriculum; description?: string; iconEmoji?: string }) {
    const subject = await this.service.createSubject(data);
    return { success: true, data: subject };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const subject = await this.service.updateSubject(id, data);
    return { success: true, data: subject };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.deleteSubject(id);
    return { success: true };
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    const docs = await this.service.getSubjectDocuments(id);
    return { success: true, data: docs };
  }
}
