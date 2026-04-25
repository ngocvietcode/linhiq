---
id: LIQ-302
title: Teacher / Class mode (B2B revenue stream)
phase: 3
priority: P2
estimate: 15d
status: Backlog
depends_on: [LIQ-103, LIQ-207]
blocks: []
tags: [backend, frontend, db, b2b, role]
---

# LIQ-302 — Teacher / Class Mode

## Problem

LinhIQ hiện B2C thuần. Lớn nhất revenue opportunity tại VN: bán license theo lớp cho trường quốc tế / trung tâm luyện thi IGCSE/A-Level. Teacher cần:
- Assign lộ trình cho lớp
- Monitor progress cả lớp
- Báo cáo cho phụ huynh / hiệu trưởng

Hiện không có role `TEACHER`, không có `Class` concept.

## User story

> Là giáo viên IGCSE Biology tại trường International School, tôi quản lý 25 học sinh. Tôi cần assign topic "Transport in Plants" cho cả lớp tuần này, xem ai master, ai đang kẹt, và export báo cáo cho phụ huynh.

## Acceptance criteria

- [ ] New role `TEACHER` + `SCHOOL_ADMIN` in `Role` enum
- [ ] `Class` model: name, curriculum, year level, teacher owner
- [ ] Invite students via email or join code
- [ ] Teacher dashboard: class roster, per-student mastery, assignment status
- [ ] Assignment system: teacher assigns topic/quiz/past paper → students get task in their plan (LIQ-203)
- [ ] Class analytics: average mastery, time spent, common mistakes
- [ ] Bulk export reports (PDF / CSV) for parent-teacher meetings
- [ ] Multi-class support per teacher
- [ ] School tier: multiple teachers + admin view
- [ ] Billing: per-seat monthly, school-wide license
- [ ] Privacy: teacher sees only classes they own

## Technical approach

### Data model

```prisma
model Class {
  id          String   @id @default(cuid())
  name        String
  curriculum  Curriculum
  yearLevel   String
  schoolId    String?
  teacherId   String
  joinCode    String   @unique
  createdAt   DateTime @default(now())
  archivedAt  DateTime?
  memberships ClassMembership[]
  assignments Assignment[]
  teacher     User     @relation("TeacherClasses", fields: [teacherId], references: [id])
  school      School?  @relation(fields: [schoolId], references: [id])

  @@index([teacherId])
  @@index([schoolId])
}

model ClassMembership {
  id       String   @id @default(cuid())
  classId  String
  studentId String
  joinedAt DateTime @default(now())
  class    Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  student  User     @relation("ClassStudents", fields: [studentId], references: [id], onDelete: Cascade)
  @@unique([classId, studentId])
}

model School {
  id        String   @id @default(cuid())
  name      String
  country   String
  createdAt DateTime @default(now())
  classes   Class[]
  staff     SchoolStaff[]
}

model SchoolStaff {
  id       String @id @default(cuid())
  schoolId String
  userId   String
  role     SchoolRole
  school   School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([schoolId, userId])
}

model Assignment {
  id          String   @id @default(cuid())
  classId     String
  title       String
  type        AssignmentType
  subjectId   String?
  topicId     String?
  quizId      String?
  paperDocId  String?
  dueAt       DateTime?
  createdAt   DateTime @default(now())
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  submissions AssignmentSubmission[]
  @@index([classId])
}

model AssignmentSubmission {
  id           String @id @default(cuid())
  assignmentId String
  studentId    String
  status       SubmissionStatus
  score        Float?
  completedAt  DateTime?
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
}

enum SchoolRole { ADMIN TEACHER STAFF }
enum AssignmentType { TOPIC QUIZ PAST_PAPER READING }
enum SubmissionStatus { NOT_STARTED IN_PROGRESS SUBMITTED GRADED }
```

Update `Role` enum: add `TEACHER`, `SCHOOL_ADMIN`.

### Backend

New module `apps/api/src/modules/class/`:
- CRUD classes, memberships, assignments
- `GET /class/:id/analytics` — aggregated stats
- Billing webhook (Stripe / future)

### Frontend

New route tree `apps/web/src/app/teacher/`:
- `/teacher` — classes list
- `/teacher/classes/:id` — roster + analytics + assignments
- `/teacher/assignments/new`
- `/teacher/reports/:classId/:studentId`

Role-gated layout.

## API design

```ts
POST   /class                                { name, curriculum, yearLevel }
GET    /class/my                             → Class[]
GET    /class/:id/roster                     → ClassMembership[] with progress
POST   /class/:id/invite                     { emails[] }
POST   /class/join                           { joinCode }
POST   /class/:id/assignments                { type, topicId?, dueAt? }
GET    /class/:id/analytics
POST   /class/:id/report                     → PDF download
```

## UI notes

- Teacher dashboard differs significantly from student
- Data-heavy: tables + charts (use recharts or similar)
- Bulk actions: "assign to all except..." etc.
- Clear distinction: teacher never sees chat message content unless student opts-in to share

## Testing

- RBAC: student cannot hit `/class/*` POST endpoints
- Privacy: teacher A cannot access teacher B's class
- Scale: class with 50 students renders fast
- Manual: end-to-end onboarding a school

## Out of scope (this ticket)

- LMS integration (Google Classroom, Moodle) — separate future work
- Parent-teacher chat — future
- Live classroom mode (real-time Q&A) — future
- Billing UI — track separately

## References

- Tie-ins: LIQ-103 parent dashboard (share aggregation code), LIQ-207 progress metrics
