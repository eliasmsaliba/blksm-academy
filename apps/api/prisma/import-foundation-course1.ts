/**
 * One-off script: imports all 6 modules of Foundation Academy / Course 1 –
 * BLKSM Identity from the parsed source documents (./data/foundation-course1.json,
 * produced by parsing the client's real course-content docx files) — lessons,
 * lesson-scoped Knowledge Checks, module-scoped Module Assessments (full exam
 * spec: timed, randomized pool, mixed auto/manually-graded questions) and
 * Practical Assignments where the source provides one.
 *
 * Module 1 already exists (5 lessons hand-migrated earlier from an older,
 * less-accurate pass) — this script UPDATES those lessons in place (matched
 * by position, not title, since a few titles differ only in casing between
 * the two passes) with the corrected parsed content, and adds Module 1's
 * real Module Assessment + Practical Assignment for the first time. Modules
 * 2–6 are created fresh. Safe to re-run: CourseModule/Lesson are upserted by
 * (parent, order); Assessment/Assignment creation is skipped if one already
 * exists for that scope; lesson-scoped Knowledge Check questions are
 * replaced (old links unlinked, not hard-deleted, so any historical
 * AssessmentAnswer rows stay valid) rather than duplicated on re-run.
 *
 * Run once against production: node dist-seed/import-foundation-course1.js
 */
import { PrismaClient, QuestionType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ParsedOption {
  optionText: string;
  isCorrect: boolean;
}

interface ParsedKcQuestion {
  questionType: "MCQ_SINGLE" | "TRUE_FALSE";
  promptText: string;
  options: ParsedOption[];
}

interface ParsedSection {
  heading: string;
  body: string;
}

interface ParsedLesson {
  lessonNum: number;
  title: string;
  estimatedDurationMinutes: number | null;
  lessonCode: string | null;
  competenciesDeveloped: string[];
  introduction: string | null;
  learningOutcomes: string[];
  leadershipThought: string | null;
  sections: ParsedSection[];
  reflection: string | null;
  knowledgeCheckQuestions: ParsedKcQuestion[];
}

interface ParsedExamQuestion {
  questionType: "MCQ_SINGLE" | "TRUE_FALSE" | "ESSAY" | "SHORT_ANSWER";
  points: number;
  promptText: string;
  options?: ParsedOption[];
  gradingGuidance?: string;
}

interface ParsedAssignment {
  title: string;
  description: string;
  maxPoints: number;
  weightPercent: number | null;
}

interface ParsedAssessment {
  moduleTitle: string | null;
  assessmentPurposeText: string | null;
  assessmentPurposeBullets: string[];
  passMarkPercent: number;
  maxAttempts: number;
  timeLimitMinutes: number;
  questionPoolSize: number | null;
  questions: ParsedExamQuestion[];
  assignment: ParsedAssignment | null;
  facilitatorGuide: string | null;
}

interface ParsedModule {
  moduleNum: number;
  title: string;
  description: string | null;
  deliveryMethod: string | null;
  learningOutcomes: string[];
  resourcesRequired: string[];
  lessons: ParsedLesson[];
  assessment: ParsedAssessment | null;
}

// Resolved from process.cwd() (always `apps/api`, whether run via `ts-node
// prisma/import-foundation-course1.ts` in dev or `node dist-seed/import-foundation-course1.js`
// in production — __dirname would differ between those two, cwd doesn't).
const dataPath = path.join(process.cwd(), "prisma", "data", "foundation-course1.json");
const { modules } = JSON.parse(fs.readFileSync(dataPath, "utf8")) as { modules: ParsedModule[] };

function buildLessonContent(lesson: ParsedLesson) {
  const content: Record<string, unknown> = { format: "structured-v1" };
  if (lesson.lessonCode) content.lessonCode = lesson.lessonCode;
  if (lesson.competenciesDeveloped.length) content.competenciesDeveloped = lesson.competenciesDeveloped;
  if (lesson.introduction) content.introduction = lesson.introduction;
  if (lesson.learningOutcomes.length) content.learningOutcomes = lesson.learningOutcomes;
  if (lesson.leadershipThought) content.leadershipThought = lesson.leadershipThought;
  content.sections = lesson.sections;
  if (lesson.reflection) content.reflection = lesson.reflection;
  return content;
}

async function upsertKnowledgeCheck(lessonId: string, lessonNum: number, questions: ParsedKcQuestion[]) {
  if (!questions.length) return;

  let assessment = await prisma.assessment.findFirst({ where: { lessonId } });
  if (!assessment) {
    assessment = await prisma.assessment.create({
      data: {
        lessonId,
        title: `Knowledge Check ${lessonNum}`,
        passMarkPercent: 70,
        maxAttempts: 3,
        assessmentKind: "ASSESSMENT",
        status: "PUBLISHED",
      },
    });
  } else {
    // Replace the question set: unlink old questions (never hard-delete —
    // an old Question row may still be referenced by a historical
    // AssessmentAnswer), then add the corrected set below.
    await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: assessment.id } });
  }

  for (const [i, q] of questions.entries()) {
    const question = await prisma.question.create({
      data: {
        questionType: q.questionType as QuestionType,
        promptText: { text: q.promptText },
        points: 1,
        options: {
          create: q.options.map((o, oi) => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: oi })),
        },
      },
    });
    await prisma.assessmentQuestion.create({
      data: { assessmentId: assessment.id, questionId: question.id, order: i },
    });
  }
}

async function createModuleAssessment(courseModuleId: string, moduleTitle: string, a: ParsedAssessment, createdById?: string) {
  const existing = await prisma.assessment.findFirst({ where: { courseModuleId } });
  if (existing) {
    console.log(`  Module Assessment already exists for "${moduleTitle}" — skipping.`);
    return;
  }

  const description = [a.assessmentPurposeText, a.facilitatorGuide ? `Facilitator guidance:\n${a.facilitatorGuide}` : null]
    .filter(Boolean)
    .join("\n\n");

  const assessment = await prisma.assessment.create({
    data: {
      courseModuleId,
      title: `${moduleTitle} — Module Assessment`,
      description: description || undefined,
      assessmentKind: "EXAM",
      passMarkPercent: a.passMarkPercent,
      maxAttempts: a.maxAttempts,
      timeLimitMinutes: a.timeLimitMinutes,
      questionPoolSize: a.questionPoolSize ?? undefined,
      randomizeQuestions: true,
      randomizeAnswers: true,
      status: "PUBLISHED",
      createdById,
    },
  });

  for (const [i, q] of a.questions.entries()) {
    const question = await prisma.question.create({
      data: {
        questionType: q.questionType as QuestionType,
        promptText: { text: q.promptText },
        points: q.points,
        gradingGuidance: q.gradingGuidance,
        createdById,
        options: q.options
          ? { create: q.options.map((o, oi) => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: oi })) }
          : undefined,
      },
    });
    await prisma.assessmentQuestion.create({
      data: { assessmentId: assessment.id, questionId: question.id, order: i },
    });
  }
  console.log(`  Created Module Assessment for "${moduleTitle}" with ${a.questions.length} questions.`);
}

async function createModuleAssignment(courseModuleId: string, moduleTitle: string, assignment: ParsedAssignment, createdById?: string) {
  const existing = await prisma.assignment.findFirst({ where: { courseModuleId } });
  if (existing) {
    console.log(`  Practical Assignment already exists for "${moduleTitle}" — skipping.`);
    return;
  }
  await prisma.assignment.create({
    data: {
      courseModuleId,
      title: assignment.title,
      description: assignment.description,
      maxPoints: assignment.maxPoints,
      status: "PUBLISHED",
      createdById,
    },
  });
  console.log(`  Created Practical Assignment "${assignment.title}" for "${moduleTitle}".`);
}

async function main() {
  const academy = await prisma.academy.findUnique({ where: { slug: "foundation-academy" } });
  if (!academy) throw new Error('Academy "foundation-academy" not found — has it been created yet?');

  const course = await prisma.course.findFirst({
    where: { academyId: academy.id, slug: "course-1-blksm-identity" },
  });
  if (!course) throw new Error('Course "course-1-blksm-identity" not found under Foundation Academy.');

  const superAdminRole = await prisma.role.findUnique({ where: { name: "Super Administrator" } });
  const author = superAdminRole
    ? await prisma.user.findFirst({ where: { userRoles: { some: { roleId: superAdminRole.id } } } })
    : null;
  const createdById = author?.id;

  for (const mod of modules) {
    const order = mod.moduleNum - 1;
    let courseModule = await prisma.courseModule.findFirst({ where: { courseId: course.id, order } });

    const moduleData = {
      title: `Module ${mod.moduleNum}: ${mod.title}`,
      description: mod.description ?? undefined,
      deliveryMethod: mod.deliveryMethod ?? undefined,
      learningOutcomes: mod.learningOutcomes.length ? mod.learningOutcomes.join("\n") : undefined,
      resourcesRequired: mod.resourcesRequired,
    };

    if (!courseModule) {
      courseModule = await prisma.courseModule.create({
        data: { ...moduleData, courseId: course.id, order, status: "PUBLISHED" },
      });
      console.log(`Created CourseModule "${moduleData.title}".`);
    } else {
      courseModule = await prisma.courseModule.update({ where: { id: courseModule.id }, data: moduleData });
      console.log(`Updated CourseModule "${moduleData.title}".`);
    }

    for (const lesson of mod.lessons) {
      const lessonOrder = lesson.lessonNum - 1;
      let lessonRow = await prisma.lesson.findFirst({ where: { courseModuleId: courseModule.id, order: lessonOrder } });
      const lessonData = {
        title: lesson.title,
        content: buildLessonContent(lesson) as any,
        estimatedDurationMinutes: lesson.estimatedDurationMinutes ?? undefined,
      };

      if (!lessonRow) {
        lessonRow = await prisma.lesson.create({
          data: {
            ...lessonData,
            courseModuleId: courseModule.id,
            order: lessonOrder,
            lessonType: "RICH_TEXT",
            status: "PUBLISHED",
          },
        });
        console.log(`  Created Lesson ${lesson.lessonNum}: "${lesson.title}".`);
      } else {
        lessonRow = await prisma.lesson.update({ where: { id: lessonRow.id }, data: lessonData });
        console.log(`  Updated Lesson ${lesson.lessonNum}: "${lesson.title}".`);
      }

      await upsertKnowledgeCheck(lessonRow.id, lesson.lessonNum, lesson.knowledgeCheckQuestions);
    }

    if (mod.assessment) {
      await createModuleAssessment(courseModule.id, mod.title, mod.assessment, createdById);
      if (mod.assessment.assignment) {
        await createModuleAssignment(courseModule.id, mod.title, mod.assessment.assignment, createdById);
      }
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
