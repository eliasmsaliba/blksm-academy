import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Deletes every row flagged isDemoData=true. Safe to run any time; re-seed with `npm run db:seed`. */
async function main() {
  const lessons = await prisma.lesson.deleteMany({ where: { isDemoData: true } });
  const modules = await prisma.courseModule.deleteMany({ where: { isDemoData: true } });
  const courses = await prisma.course.deleteMany({ where: { isDemoData: true } });
  const academies = await prisma.academy.deleteMany({ where: { isDemoData: true } });
  const departments = await prisma.department.deleteMany({ where: { isDemoData: true } });

  console.log("Wiped demo data:", {
    lessons: lessons.count,
    modules: modules.count,
    courses: courses.count,
    academies: academies.count,
    departments: departments.count,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
