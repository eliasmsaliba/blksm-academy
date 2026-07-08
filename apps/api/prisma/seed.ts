import { PrismaClient, AuthProviderType, ContentStatus, LessonType } from "@prisma/client";
import * as argon2 from "argon2";
import {
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from "@blksm/shared";

const prisma = new PrismaClient();

async function seedPermissions() {
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      create: perm,
      update: { resource: perm.resource, action: perm.action, description: perm.description },
    });
  }
  console.log(`Seeded ${PERMISSION_DEFINITIONS.length} permissions.`);
}

async function seedRoles() {
  const allPermissionKeys = PERMISSION_DEFINITIONS.map((p) => p.key);

  for (const [roleName, bundle] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName, isSystem: true },
      update: {},
    });

    const keys = bundle === "*" ? allPermissionKeys : bundle;
    const permissions = await prisma.permission.findMany({ where: { key: { in: keys } } });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
  }
  console.log(`Seeded ${Object.keys(DEFAULT_ROLE_PERMISSIONS).length} roles.`);
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@blksmevents.com";
  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123!";

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "Super Administrator" },
  });

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      firstName: "Super",
      lastName: "Admin",
      authIdentities: { create: { provider: AuthProviderType.LOCAL, passwordHash } },
      userRoles: { create: { roleId: superAdminRole.id } },
    },
    update: {},
  });
  console.log(`Seeded Super Administrator user: ${user.email}`);
}

async function seedDemoContent() {
  const department = await prisma.department.upsert({
    where: { code: "DEMO-OPS" },
    create: {
      name: "DEMO — Events Operations",
      code: "DEMO-OPS",
      isDemoData: true,
    },
    update: {},
  });

  const academy = await prisma.academy.upsert({
    where: { slug: "demo-foundation-academy" },
    create: {
      name: "DEMO — Foundation Academy",
      slug: "demo-foundation-academy",
      description: "Sample academy seeded for verification. Safe to delete — replace with real academy content.",
      status: ContentStatus.PUBLISHED,
      isDemoData: true,
    },
    update: {},
  });

  const course = await prisma.course.upsert({
    where: { academyId_slug: { academyId: academy.id, slug: "demo-event-basics" } },
    create: {
      academyId: academy.id,
      title: "DEMO — Event Management Basics",
      slug: "demo-event-basics",
      description: "Sample course seeded for verification.",
      status: ContentStatus.PUBLISHED,
      order: 0,
      isDemoData: true,
    },
    update: {},
  });

  let courseModule = await prisma.courseModule.findFirst({
    where: { courseId: course.id, title: "DEMO — Getting Started" },
  });
  if (!courseModule) {
    courseModule = await prisma.courseModule.create({
      data: {
        courseId: course.id,
        title: "DEMO — Getting Started",
        description: "Sample module seeded for verification.",
        status: ContentStatus.PUBLISHED,
        order: 0,
        isDemoData: true,
      },
    });
  }

  const lessons = [
    { title: "DEMO — Welcome", order: 0 },
    { title: "DEMO — Core Concepts", order: 1 },
  ];
  for (const lessonData of lessons) {
    const existing = await prisma.lesson.findFirst({
      where: { courseModuleId: courseModule.id, title: lessonData.title },
    });
    if (!existing) {
      await prisma.lesson.create({
        data: {
          courseModuleId: courseModule.id,
          title: lessonData.title,
          lessonType: LessonType.RICH_TEXT,
          content: {
            body: "DEMO CONTENT — replace with real content. This lesson was created by the Phase 1 seed script purely to verify the platform end-to-end.",
          },
          order: lessonData.order,
          status: ContentStatus.PUBLISHED,
          isDemoData: true,
        },
      });
    }
  }

  console.log("Seeded DEMO department/academy/course/module/lessons.");
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedSuperAdmin();
  await seedDemoContent();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
