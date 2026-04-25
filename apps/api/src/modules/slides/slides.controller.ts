import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';

import { SlidesService } from './slides.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { summarizeSlidesSchema } from '@linhiq/validators';

interface AuthedRequest extends Request {
  user: { sub: string };
}

@Controller('slides')
@UseGuards(AuthGuard)
export class SlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Post('summarize')
  async summarize(@Req() req: AuthedRequest, @Body() body: unknown) {
    const parsed = summarizeSlidesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.slides.summarize(req.user.sub, parsed.data);
  }

  @Get()
  async list(@Req() req: AuthedRequest) {
    return this.slides.listForUser(req.user.sub);
  }

  @Get(':id')
  async getOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.slides.getDeck(req.user.sub, id);
  }
}
