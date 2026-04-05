import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('settings')
  async getSettings() {
    try {
      const settings = await this.adminService.getSettings();
      return { success: true, data: settings };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('settings/provider')
  async updateProvider(@Body('provider') provider: string) {
    if (!provider) {
      throw new HttpException('Provider required', HttpStatus.BAD_REQUEST);
    }

    try {
      const settings = await this.adminService.updateProvider(provider);
      return { success: true, data: settings };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
