-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "complexQueryModel" TEXT NOT NULL DEFAULT 'gemini-2.5-pro',
ADD COLUMN     "embeddingModel" TEXT NOT NULL DEFAULT 'gemini-embedding-001',
ADD COLUMN     "simpleQueryModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
