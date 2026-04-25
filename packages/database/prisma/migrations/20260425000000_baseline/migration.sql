-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog" VERSION "1.0";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public" VERSION "0.8.2";

-- CreateEnum
CREATE TYPE "public"."BookType" AS ENUM ('COURSEBOOK', 'WORKBOOK', 'TEACHER_GUIDE', 'PAST_PAPER', 'SYLLABUS', 'REVISION_GUIDE');

-- CreateEnum
CREATE TYPE "public"."ChatMode" AS ENUM ('SUBJECT', 'OPEN');

-- CreateEnum
CREATE TYPE "public"."Curriculum" AS ENUM ('IGCSE', 'A_LEVEL', 'THPT_VN', 'IB', 'AP');

-- CreateEnum
CREATE TYPE "public"."HintLevel" AS ENUM ('L1', 'L2', 'L3', 'L4', 'L5');

-- CreateEnum
CREATE TYPE "public"."QuizType" AS ENUM ('TOPIC', 'UNIT');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('STUDENT', 'PARENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."SourceType" AS ENUM ('TEXTBOOK', 'MARK_SCHEME', 'PAST_PAPER', 'SYLLABUS');

-- CreateEnum
CREATE TYPE "public"."TopicCategory" AS ENUM ('ACADEMIC', 'GENERAL', 'HOBBIES', 'LIFE', 'EMOTIONAL', 'MATURE_SOFT', 'AGE_BOUNDARY', 'HARMFUL');

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookPageTopic" (
    "id" TEXT NOT NULL,
    "bookVolumeId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "topicId" TEXT,
    "chapterName" TEXT,

    CONSTRAINT "BookPageTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookVolume" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "bookType" "public"."BookType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "coverColor" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER,
    "pagesDir" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookVolume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hintLevel" "public"."HintLevel",
    "imageUrl" TEXT,
    "modelUsed" TEXT,
    "ragSources" TEXT[],
    "safeCategory" "public"."TopicCategory",
    "tokensUsed" INTEGER,
    "wasRedirected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "hintLevel" "public"."HintLevel" NOT NULL DEFAULT 'L1',
    "mode" "public"."ChatMode" NOT NULL DEFAULT 'SUBJECT',

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiagnosticQuestion" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct" INTEGER NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "DiagnosticQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiagnosticResult" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answeredIdx" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileSize" INTEGER,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "pageCount" INTEGER,
    "processedAt" TIMESTAMP(3),
    "sourceType" "public"."SourceType" NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "topicId" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector(3072),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chunkIndex" INTEGER NOT NULL,
    "keywords" TEXT[],

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KeyTermEarned" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyTermEarned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParentChild" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "quizType" "public"."QuizType" NOT NULL,
    "topicId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unitId" TEXT,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuizQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "topicId" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "studentAnswer" TEXT,
    "isCorrect" BOOLEAN,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReaderBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookVolumeId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReaderBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReaderNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookVolumeId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionTopicStat" (
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
CREATE TABLE "public"."SlideDeckSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "bookVolumeId" TEXT,
    "topicId" TEXT,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "depth" TEXT NOT NULL DEFAULT 'standard',
    "deckJson" JSONB NOT NULL,
    "tokenUsage" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlideDeckSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "curriculum" "public"."Curriculum" NOT NULL DEFAULT 'IGCSE',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "studyGoal" INTEGER NOT NULL DEFAULT 60,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastStudyAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "durationMin" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconEmoji" TEXT NOT NULL DEFAULT '📚',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nameVi" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "curriculum" "public"."Curriculum" NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubjectEnrollment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "onboardingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitFree" INTEGER NOT NULL DEFAULT 10,
    "rateLimitPro" INTEGER NOT NULL DEFAULT 999,
    "safeChatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "safeChatModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "complexQueryModel" TEXT NOT NULL DEFAULT 'gemini-2.5-pro',
    "embeddingModel" TEXT NOT NULL DEFAULT 'gemini-embedding-001',
    "simpleQueryModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "liteLlmApiKey" TEXT,
    "liteLlmUrl" TEXT,
    "openChatPrompt" TEXT,
    "maxTokensOpenChat" INTEGER NOT NULL DEFAULT 300,
    "maxTokensSocratic" INTEGER NOT NULL DEFAULT 1024,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Topic" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "nameVi" TEXT,
    "unitId" TEXT,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TopicProgress" (
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
CREATE TABLE "public"."Unit" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "googleId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyTopicStat" (
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

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "public"."AuditLog"("adminId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "BookPageTopic_bookVolumeId_idx" ON "public"."BookPageTopic"("bookVolumeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BookPageTopic_bookVolumeId_pageNumber_key" ON "public"."BookPageTopic"("bookVolumeId" ASC, "pageNumber" ASC);

-- CreateIndex
CREATE INDEX "BookPageTopic_topicId_idx" ON "public"."BookPageTopic"("topicId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BookVolume_documentId_key" ON "public"."BookVolume"("documentId" ASC);

-- CreateIndex
CREATE INDEX "BookVolume_isDefault_idx" ON "public"."BookVolume"("isDefault" ASC);

-- CreateIndex
CREATE INDEX "BookVolume_subjectId_idx" ON "public"."BookVolume"("subjectId" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "public"."ChatMessage"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "public"."ChatMessage"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "ChatSession_createdAt_idx" ON "public"."ChatSession"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ChatSession_subjectId_idx" ON "public"."ChatSession"("subjectId" ASC);

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "public"."ChatSession"("userId" ASC);

-- CreateIndex
CREATE INDEX "Document_isProcessed_idx" ON "public"."Document"("isProcessed" ASC);

-- CreateIndex
CREATE INDEX "Document_subjectId_idx" ON "public"."Document"("subjectId" ASC);

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "public"."DocumentChunk"("documentId" ASC);

-- CreateIndex
CREATE INDEX "DocumentChunk_topicId_idx" ON "public"."DocumentChunk"("topicId" ASC);

-- CreateIndex
CREATE INDEX "KeyTermEarned_subjectId_idx" ON "public"."KeyTermEarned"("subjectId" ASC);

-- CreateIndex
CREATE INDEX "KeyTermEarned_userId_idx" ON "public"."KeyTermEarned"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_parentId_childId_key" ON "public"."ParentChild"("parentId" ASC, "childId" ASC);

-- CreateIndex
CREATE INDEX "QuizAttempt_topicId_idx" ON "public"."QuizAttempt"("topicId" ASC);

-- CreateIndex
CREATE INDEX "QuizAttempt_unitId_idx" ON "public"."QuizAttempt"("unitId" ASC);

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "public"."QuizAttempt"("userId" ASC);

-- CreateIndex
CREATE INDEX "QuizQuestion_attemptId_idx" ON "public"."QuizQuestion"("attemptId" ASC);

-- CreateIndex
CREATE INDEX "ReaderBookmark_userId_bookVolumeId_idx" ON "public"."ReaderBookmark"("userId" ASC, "bookVolumeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReaderBookmark_userId_bookVolumeId_pageNumber_key" ON "public"."ReaderBookmark"("userId" ASC, "bookVolumeId" ASC, "pageNumber" ASC);

-- CreateIndex
CREATE INDEX "ReaderNote_userId_bookVolumeId_idx" ON "public"."ReaderNote"("userId" ASC, "bookVolumeId" ASC);

-- CreateIndex
CREATE INDEX "ReaderNote_userId_bookVolumeId_pageNumber_idx" ON "public"."ReaderNote"("userId" ASC, "bookVolumeId" ASC, "pageNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SessionTopicStat_sessionId_key" ON "public"."SessionTopicStat"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "SlideDeckSnapshot_bookVolumeId_idx" ON "public"."SlideDeckSnapshot"("bookVolumeId" ASC);

-- CreateIndex
CREATE INDEX "SlideDeckSnapshot_userId_createdAt_idx" ON "public"."SlideDeckSnapshot"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "public"."StudentProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "StudySession_date_idx" ON "public"."StudySession"("date" ASC);

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "public"."StudySession"("userId" ASC);

-- CreateIndex
CREATE INDEX "Subject_curriculum_idx" ON "public"."Subject"("curriculum" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_curriculum_key" ON "public"."Subject"("name" ASC, "curriculum" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectEnrollment_profileId_subjectId_key" ON "public"."SubjectEnrollment"("profileId" ASC, "subjectId" ASC);

-- CreateIndex
CREATE INDEX "Topic_subjectId_idx" ON "public"."Topic"("subjectId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_subjectId_name_key" ON "public"."Topic"("subjectId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "Topic_unitId_idx" ON "public"."Topic"("unitId" ASC);

-- CreateIndex
CREATE INDEX "TopicProgress_userId_idx" ON "public"."TopicProgress"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TopicProgress_userId_topicId_key" ON "public"."TopicProgress"("userId" ASC, "topicId" ASC);

-- CreateIndex
CREATE INDEX "Unit_subjectId_idx" ON "public"."Unit"("subjectId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_subjectId_name_key" ON "public"."Unit"("subjectId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "public"."User"("googleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyTopicStat_userId_weekStart_key" ON "public"."WeeklyTopicStat"("userId" ASC, "weekStart" ASC);

-- CreateIndex
CREATE INDEX "WeeklyTopicStat_weekStart_idx" ON "public"."WeeklyTopicStat"("weekStart" ASC);

-- AddForeignKey
ALTER TABLE "public"."BookPageTopic" ADD CONSTRAINT "BookPageTopic_bookVolumeId_fkey" FOREIGN KEY ("bookVolumeId") REFERENCES "public"."BookVolume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookPageTopic" ADD CONSTRAINT "BookPageTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookVolume" ADD CONSTRAINT "BookVolume_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookVolume" ADD CONSTRAINT "BookVolume_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatSession" ADD CONSTRAINT "ChatSession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiagnosticQuestion" ADD CONSTRAINT "DiagnosticQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiagnosticResult" ADD CONSTRAINT "DiagnosticResult_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."DiagnosticQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentChunk" ADD CONSTRAINT "DocumentChunk_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KeyTermEarned" ADD CONSTRAINT "KeyTermEarned_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentChild" ADD CONSTRAINT "ParentChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentChild" ADD CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizQuestion" ADD CONSTRAINT "QuizQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReaderBookmark" ADD CONSTRAINT "ReaderBookmark_bookVolumeId_fkey" FOREIGN KEY ("bookVolumeId") REFERENCES "public"."BookVolume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReaderBookmark" ADD CONSTRAINT "ReaderBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReaderNote" ADD CONSTRAINT "ReaderNote_bookVolumeId_fkey" FOREIGN KEY ("bookVolumeId") REFERENCES "public"."BookVolume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReaderNote" ADD CONSTRAINT "ReaderNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionTopicStat" ADD CONSTRAINT "SessionTopicStat_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SlideDeckSnapshot" ADD CONSTRAINT "SlideDeckSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubjectEnrollment" ADD CONSTRAINT "SubjectEnrollment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubjectEnrollment" ADD CONSTRAINT "SubjectEnrollment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Topic" ADD CONSTRAINT "Topic_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TopicProgress" ADD CONSTRAINT "TopicProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

