import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ParentService } from './parent.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
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
  ) {
    return this.parent.getChildOverview(req.user.sub, childId);
  }

  @Get('children/:childId/report')
  async getChildReport(
    @Req() req: RequestWithUser,
    @Param('childId') childId: string,
  ) {
    return this.parent.getChildReport(req.user.sub, childId);
  }
}
