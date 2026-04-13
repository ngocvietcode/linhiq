/*
  Warnings:

  - The values [TEACHER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `metadata` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `activeGlobalAiProvider` on the `SystemSetting` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `QuizAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectProgress` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `sourceType` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `chunkIndex` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `curriculum` on the `Subject` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `iconEmoji` on table `Subject` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Curriculum" AS ENUM ('IGCSE', 'A_LEVEL', 'THPT_VN', 'IB', 'AP');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('TEXTBOOK', 'MARK_SCHEME', 'PAST_PAPER', 'SYLLABUS');

-- CreateEnum
CREATE TYPE "HintLevel" AS ENUM ('L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "ChatMode" AS ENUM ('SUBJECT', 'OPEN');

-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('ACADEMIC', 'GENERAL', 'HOBBIES', 'LIFE', 'EMOTIONAL', 'MATURE_SOFT', 'AGE_BOUNDARY', 'HARMFUL');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'PARENT', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectProgress" DROP CONSTRAINT "SubjectProgress_topicId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectProgress" DROP CONSTRAINT "SubjectProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_parentId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "metadata",
ADD COLUMN     "hintLevel" "HintLevel",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "modelUsed" TEXT,
ADD COLUMN     "ragSources" TEXT[],
ADD COLUMN     "safeCategory" "TopicCategory",
ADD COLUMN     "tokensUsed" INTEGER,
ADD COLUMN     "wasRedirected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "hintLevel" "HintLevel" NOT NULL DEFAULT 'L1',
ADD COLUMN     "mode" "ChatMode" NOT NULL DEFAULT 'SUBJECT',
ALTER COLUMN "subjectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "processedAt" TIMESTAMP(3),
DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" "SourceType" NOT NULL;

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "chunkIndex" INTEGER NOT NULL,
ADD COLUMN     "keywords" TEXT[];

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nameVi" TEXT,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "curriculum",
ADD COLUMN     "curriculum" "Curriculum" NOT NULL,
ALTER COLUMN "iconEmoji" SET NOT NULL;

-- AlterTable
ALTER TABLE "SystemSetting" DROP COLUMN "activeGlobalAiProvider",
ADD COLUMN     "defaultAiProvider" TEXT NOT NULL DEFAULT 'gemini',
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rateLimitFree" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "rateLimitPro" INTEGER NOT NULL DEFAULT 999,
ADD COLUMN     "safeChatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "safeChatModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "description" TEXT,
ADD COLUMN     "nameVi" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "parentId",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "QuizAttempt";

-- DropTable
DROP TABLE "SubjectProgress";

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "curriculum" "Curriculum" NOT NULL DEFAULT 'IGCSE',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "studyGoal" INTEGER NOT NULL DEFAULT 60,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastStudyAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectEnrollment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "durationMin" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questionsAsked" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "lastStudiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyTermEarned" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyTermEarned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticQuestion" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "DiagnosticQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticResult" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answeredIdx" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTopicStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "academic" INTEGER NOT NULL DEFAULT 0,
    "general" INTEGER NOT NULL DEFAULT 0,
    "hobbies" INTEGER NOT NULL DEFAULT 0,
    "life" INTEGER NOT NULL DEFAULT 0,
    "redirected" INTEGER NOT NULL DEFAULT 0,
    "totalMsg" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WeeklyTopicStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTopicStat" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "academic" INTEGER NOT NULL DEFAULT 0,
    "general" INTEGER NOT NULL DEFAULT 0,
    "hobbies" INTEGER NOT NULL DEFAULT 0,
    "life" INTEGER NOT NULL DEFAULT 0,
    "redirected" INTEGER NOT NULL DEFAULT 0,
    "totalMsg" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SessionTopicStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_parentId_childId_key" ON "ParentChild"("parentId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectEnrollment_profileId_subjectId_key" ON "SubjectEnrollment"("profileId", "subjectId");

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");

-- CreateIndex
CREATE INDEX "StudySession_date_idx" ON "StudySession"("date");

-- CreateIndex
CREATE INDEX "TopicProgress_userId_idx" ON "TopicProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicProgress_userId_topicId_key" ON "TopicProgress"("userId", "topicId");

-- CreateIndex
CREATE INDEX "KeyTermEarned_userId_idx" ON "KeyTermEarned"("userId");

-- CreateIndex
CREATE INDEX "KeyTermEarned_subjectId_idx" ON "KeyTermEarned"("subjectId");

-- CreateIndex
CREATE INDEX "WeeklyTopicStat_weekStart_idx" ON "WeeklyTopicStat"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyTopicStat_userId_weekStart_key" ON "WeeklyTopicStat"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "SessionTopicStat_sessionId_key" ON "SessionTopicStat"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ChatSession_createdAt_idx" ON "ChatSession"("createdAt");

-- CreateIndex
CREATE INDEX "Document_isProcessed_idx" ON "Document"("isProcessed");

-- CreateIndex
CREATE INDEX "Subject_curriculum_idx" ON "Subject"("curriculum");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_curriculum_key" ON "Subject"("name", "curriculum");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectEnrollment" ADD CONSTRAINT "SubjectEnrollment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectEnrollment" ADD CONSTRAINT "SubjectEnrollment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicProgress" ADD CONSTRAINT "TopicProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyTermEarned" ADD CONSTRAINT "KeyTermEarned_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticQuestion" ADD CONSTRAINT "DiagnosticQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DiagnosticQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopicStat" ADD CONSTRAINT "SessionTopicStat_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
