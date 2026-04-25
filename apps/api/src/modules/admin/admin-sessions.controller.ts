import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminSessionsService } from './admin-sessions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';
import {
  adminListSessionsQuerySchema,
  adminBulkSessionIdsSchema,
} from '@linhiq/validators';
import { ZodError } from 'zod';

function parseOrThrow<T>(schema: { parse: (v: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new HttpException(
        {
          message: 'Validation failed',
          issues: e.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    throw e;
  }
}

@Controller('admin/chat-sessions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSessionsController {
  constructor(private readonly sessions: AdminSessionsService) {}

  @Get()
  async list(@Query() query: Record<string, string>) {
    const parsed = parseOrThrow(adminListSessionsQuerySchema, query);
    const result = await this.sessions.list(parsed);
    return { success: true, ...result };
  }

  @Get('stats')
  async stats() {
    const data = await this.sessions.stats();
    return { success: true, data };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const session = await this.sessions.getOne(id);
    return { success: true, data: session };
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() body: unknown, @Req() req: RequestWithUser) {
    const parsed = parseOrThrow(adminBulkSessionIdsSchema, body);
    const result = await this.sessions.bulkRemove(parsed.ids, req.user.sub);
    return { success: true, data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const result = await this.sessions.remove(id, req.user.sub);
    return { success: true, data: result };
  }
}
