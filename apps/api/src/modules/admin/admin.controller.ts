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

  @Get('health')
  async getHealth() {
    return this.adminService.getHealth();
  }

  @Get('settings')
  async getSettings() {
    try {
      const settings = await this.adminService.getSettings();
      return { success: true, data: settings };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('settings/litellm')
  async updateLiteLlmConfig(
    @Body('liteLlmUrl') liteLlmUrl: string,
    @Body('liteLlmApiKey') liteLlmApiKey: string,
  ) {
    if (!liteLlmUrl || !liteLlmApiKey) {
      throw new HttpException('URL and API Key are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const settings = await this.adminService.updateLiteLlmConfig(liteLlmUrl, liteLlmApiKey);
      return { success: true, data: settings };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('settings/prompts')
  async updatePromptSettings(
    @Body('openChatPrompt') openChatPrompt: string | undefined,
    @Body('maxTokensOpenChat') maxTokensOpenChat: number | undefined,
    @Body('maxTokensSocratic') maxTokensSocratic: number | undefined,
  ) {
    try {
      const settings = await this.adminService.updatePromptSettings({
        openChatPrompt,
        maxTokensOpenChat: maxTokensOpenChat ? Number(maxTokensOpenChat) : undefined,
        maxTokensSocratic: maxTokensSocratic ? Number(maxTokensSocratic) : undefined,
      });
      return { success: true, data: settings };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('settings/models')
  async updateModels(
    @Body('simpleQueryModel') simpleQueryModel: string,
    @Body('complexQueryModel') complexQueryModel: string,
    @Body('embeddingModel') embeddingModel: string,
  ) {
    if (!simpleQueryModel || !complexQueryModel || !embeddingModel) {
      throw new HttpException('All model IDs are required', HttpStatus.BAD_REQUEST);
    }
    try {
      const settings = await this.adminService.updateModels(simpleQueryModel, complexQueryModel, embeddingModel);
      return { success: true, data: settings };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
