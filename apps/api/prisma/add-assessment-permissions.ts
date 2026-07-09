/**
 * One-off script: grants the new Knowledge Check permissions to Trainer and
 * Academy Administrator, which previously had no way to create/manage a
 * Knowledge Check (only Super Administrator could). Adds specific
 * RolePermission rows only — does NOT touch any other role or re-run the
 * full seed, so any manual customisation made via the admin Roles UI since
 * launch is left untouched. Idempotent (skipDuplicates).
 *
 * Run once against production: node dist-seed/add-assessment-permissions.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GRANTS: Record<string, string[]> = {
  Trainer: ["assessment.create", "assessment.update"],
  "Academy Administrator": [
    "question.create",
    "question.read",
    "question.update",
    "assessment.create",
    "assessment.update",
  ],
};

async function main() {
  for (const [roleName, permissionKeys] of Object.entries(GRANTS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`Role "${roleName}" not found — skipping.`);
      continue;
    }

    const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    const found = new Set(permissions.map((p) => p.key));
    const missing = permissionKeys.filter((k) => !found.has(k));
    if (missing.length) {
      console.log(`Warning: permission keys not found: ${missing.join(", ")}`);
    }

    const result = await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
    console.log(`"${roleName}": added ${result.count} new permission grant(s) (already-present ones skipped).`);
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
