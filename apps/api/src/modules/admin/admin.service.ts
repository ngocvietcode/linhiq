import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly db: DatabaseService) {}

  async getSettings() {
    // There's only one global settings row with id 'global'
    let settings = await this.db.systemSetting.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await this.db.systemSetting.create({
        data: { id: 'global', defaultAiProvider: 'gemini' },
      });
    }

    return settings;
  }

  async updateProvider(provider: string) {
    if (!['openai', 'anthropic', 'gemini'].includes(provider)) {
      throw new Error(`Invalid AI provider: ${provider}`);
    }

    return await this.db.systemSetting.upsert({
      where: { id: 'global' },
      update: { defaultAiProvider: provider },
      create: { id: 'global', defaultAiProvider: provider },
    });
  }
}
