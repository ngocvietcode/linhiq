import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ParentService } from './parent.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  parentCreateChildSchema,
  parentInviteChildSchema,
} from '@linhiq/validators';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('parent')
@UseGuards(AuthGuard, RolesGuard)
@Roles('PARENT', 'ADMIN')
export class ParentController {
  constructor(private readonly parent: ParentService) {}

  @Get('children')
  async getChildren(@Req() req: RequestWithUser) {
    return this.parent.listChildren(req.user.sub);
  }

  @Get('children/:childId/overview')
  async getChildOverview(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Query('days') days?: string,
  ) {
    return this.parent.getChildOverview(req.user.sub, childId, days ? Number(days) : undefined);
  }

  @Get('children/:childId/report')
  async getChildReport(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Query('days') days?: string,
  ) {
    return this.parent.getChildReport(req.user.sub, childId, days ? Number(days) : undefined);
  }

  @Get('children/:childId/sessions')
  async getChildSessions(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Query('days') days?: string,
    @Query('onlyConcerning') onlyConcerning?: string,
    @Query('limit') limit?: string,
  ) {
    return this.parent.listChildSessions(req.user.sub, childId, {
      days: days ? Number(days) : undefined,
      onlyConcerning: onlyConcerning === 'true' || onlyConcerning === '1',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('children/:childId/sessions/:sessionId')
  async getChildSession(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.parent.getChildSession(req.user.sub, childId, sessionId);
  }

  @Get('children/:childId/alerts')
  async getChildAlerts(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Query('days') days?: string,
  ) {
    return this.parent.getChildAlerts(req.user.sub, childId, days ? Number(days) : undefined);
  }

  @Get('children/:childId/quizzes')
  async getChildQuizzes(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Query('limit') limit?: string,
  ) {
    return this.parent.getChildQuizzes(req.user.sub, childId, limit ? Number(limit) : undefined);
  }

  @Get('children/:childId/subjects/:subjectId')
  async getChildSubjectDetail(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.parent.getChildSubjectDetail(req.user.sub, childId, subjectId);
  }

  @Get('children/:childId/timeline')
  async getChildTimeline(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Query('days') days?: string,
  ) {
    return this.parent.getChildTimeline(req.user.sub, childId, days ? Number(days) : undefined);
  }

  @Patch('children/:childId/study-goal')
  async setChildStudyGoal(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
    @Body() body: { goalMin: number },
  ) {
    return this.parent.updateChildStudyGoal(req.user.sub, childId, Number(body.goalMin));
  }

  @Post('children')
  async createChild(@Req() req: RequestWithUser, @Body() body: unknown) {
    const input = parentCreateChildSchema.parse(body);
    return this.parent.createChildAccount(req.user.sub, input);
  }

  @Post('link-requests')
  async inviteChild(@Req() req: RequestWithUser, @Body() body: unknown) {
    const input = parentInviteChildSchema.parse(body);
    return this.parent.createLinkRequest(req.user.sub, input.childIdentifier);
  }

  @Get('link-requests')
  async listLinkRequests(@Req() req: RequestWithUser) {
    return this.parent.listLinkRequests(req.user.sub);
  }

  @Delete('link-requests/:id')
  async cancelLinkRequest(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.parent.cancelLinkRequest(req.user.sub, id);
  }
}
