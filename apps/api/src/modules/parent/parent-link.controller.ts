import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ParentService } from './parent.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { redeemParentLinkSchema } from '@linhiq/validators';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

/**
 * Child-side endpoints for parent linking. Any authenticated user can redeem
 * a 6-digit code; the service verifies the code targets their email and
 * creates the ParentChild link.
 */
@Controller('me/parent-link')
@UseGuards(AuthGuard)
export class ParentLinkController {
  constructor(private readonly parent: ParentService) {}

  @Post('redeem')
  async redeem(@Req() req: RequestWithUser, @Body() body: unknown) {
    const input = redeemParentLinkSchema.parse(body);
    return this.parent.redeemLinkRequest(req.user.sub, input.code);
  }
}
