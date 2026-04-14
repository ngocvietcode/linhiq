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
        data: { id: 'global' },
      });
    }

    return settings;
  }

  async updateLiteLlmConfig(liteLlmUrl: string, liteLlmApiKey: string) {
    return await this.db.systemSetting.upsert({
      where: { id: 'global' },
      update: { liteLlmUrl, liteLlmApiKey },
      create: { id: 'global', liteLlmUrl, liteLlmApiKey },
    });
  }
  async updateModels(simpleQueryModel: string, complexQueryModel: string, embeddingModel: string) {
    return await this.db.systemSetting.upsert({
      where: { id: 'global' },
      update: { simpleQueryModel, complexQueryModel, embeddingModel },
      create: { 
        id: 'global', 
        simpleQueryModel,
        complexQueryModel,
        embeddingModel
      },
    });
  }
}
