import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminListUsersQuerySchema,
  adminBulkUserIdsSchema,
  adminResetPasswordSchema,
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

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  async list(@Query() query: Record<string, string>) {
    const parsed = parseOrThrow(adminListUsersQuerySchema, query);
    const result = await this.users.list(parsed);
    return { success: true, ...result };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const user = await this.users.getOne(id);
    return { success: true, data: user };
  }

  @Post()
  async create(@Body() body: unknown, @Req() req: RequestWithUser) {
    const parsed = parseOrThrow(adminCreateUserSchema, body);
    const user = await this.users.create(parsed, req.user.sub);
    return { success: true, data: user };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: RequestWithUser,
  ) {
    const parsed = parseOrThrow(adminUpdateUserSchema, body);
    const user = await this.users.update(id, parsed, req.user.sub);
    return { success: true, data: user };
  }

  @Post(':id/ban')
  async ban(@Param('id') id: string, @Req() req: RequestWithUser) {
    const user = await this.users.setActive(id, false, req.user.sub);
    return { success: true, data: user };
  }

  @Post(':id/unban')
  async unban(@Param('id') id: string, @Req() req: RequestWithUser) {
    const user = await this.users.setActive(id, true, req.user.sub);
    return { success: true, data: user };
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: RequestWithUser,
  ) {
    const parsed = parseOrThrow(adminResetPasswordSchema, body ?? {});
    const result = await this.users.resetPassword(id, parsed.password, req.user.sub);
    return { success: true, data: result };
  }

  @Post('bulk-delete')
  async bulkDelete(@Body() body: unknown, @Req() req: RequestWithUser) {
    const parsed = parseOrThrow(adminBulkUserIdsSchema, body);
    const result = await this.users.bulkRemove(parsed.ids, req.user.sub);
    return { success: true, data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const result = await this.users.remove(id, req.user.sub);
    return { success: true, data: result };
  }
}
