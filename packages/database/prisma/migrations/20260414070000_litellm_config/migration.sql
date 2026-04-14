-- AlterTable
ALTER TABLE "SystemSetting" DROP COLUMN "defaultAiProvider",
ADD COLUMN     "liteLlmApiKey" TEXT,
ADD COLUMN     "liteLlmUrl" TEXT;
