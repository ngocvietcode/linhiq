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
  async updatePromptSettings(data: {
    openChatPrompt?: string;
    maxTokensOpenChat?: number;
    maxTokensSocratic?: number;
  }) {
    const update: Record<string, unknown> = {};
    if (data.openChatPrompt !== undefined) update.openChatPrompt = data.openChatPrompt || null;
    if (data.maxTokensOpenChat !== undefined) update.maxTokensOpenChat = data.maxTokensOpenChat;
    if (data.maxTokensSocratic !== undefined) update.maxTokensSocratic = data.maxTokensSocratic;

    return this.db.systemSetting.upsert({
      where: { id: 'global' },
      update,
      create: { id: 'global', ...update },
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

  async getHealth() {
    const settings = await this.db.systemSetting.findUnique({ where: { id: 'global' } });
    const liteLlmUrl = settings?.liteLlmUrl || process.env.LITELLM_URL || 'http://localhost:4000/v1';

    const [database, llm, rag] = await Promise.all([
      this.checkDatabase(),
      this.checkLlmGateway(liteLlmUrl),
      this.checkRag(),
    ]);

    const services = { database, llm, rag };
    const allOk = Object.values(services).every((s) => s.status === 'ok');
    const anyDown = Object.values(services).some((s) => s.status === 'down');

    return {
      status: allOk ? 'ok' : anyDown ? 'down' : 'degraded',
      checkedAt: new Date().toISOString(),
      services,
    };
  }

  private async checkDatabase() {
    const start = Date.now();
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { status: 'ok' as const, latencyMs: Date.now() - start };
    } catch (e: any) {
      return { status: 'down' as const, latencyMs: Date.now() - start, error: e?.message };
    }
  }

  private async checkLlmGateway(baseUrl: string) {
    const start = Date.now();
    const url = baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '') + '/health';
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);
      return {
        status: res.ok ? ('ok' as const) : ('degraded' as const),
        latencyMs: Date.now() - start,
        httpStatus: res.status,
      };
    } catch (e: any) {
      return { status: 'down' as const, latencyMs: Date.now() - start, error: e?.message };
    }
  }

  private async checkRag() {
    try {
      const [chunks, documents] = await Promise.all([
        this.db.documentChunk.count(),
        this.db.document.count(),
      ]);
      return { status: 'ok' as const, chunks, documents };
    } catch (e: any) {
      return { status: 'down' as const, error: e?.message };
    }
  }
}
