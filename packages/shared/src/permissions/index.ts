export interface PermissionDefinition {
  key: string;
  resource: string;
  action: string;
  description: string;
}

const crud = (
  resource: string,
  label: string,
  actions: string[] = ["create", "read", "update", "delete"],
): PermissionDefinition[] =>
  actions.map((action) => ({
    key: `${resource}.${action}`,
    resource,
    action,
    description: `${action[0]!.toUpperCase()}${action.slice(1)} ${label}`,
  }));

/**
 * The full seed list of permission keys. This is the single source of truth
 * consumed by the API seed script and by the frontend for gating UI. New
 * resources/actions are additive rows here + a migration-free seed re-run —
 * never hardcoded role checks in application code.
 */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  ...crud("user", "users", ["create", "read", "update", "delete", "invite"]),
  ...crud("role", "roles", ["create", "read", "update", "delete", "assign"]),
  ...crud("permission", "permissions", ["read", "update"]),
  ...crud("department", "departments"),
  ...crud("position", "positions"),
  ...crud("employeeProfile", "employee profiles", ["read", "update"]),
  ...crud("academy", "academies", ["create", "read", "update", "delete", "publish", "archive"]),
  ...crud("course", "courses", ["create", "read", "update", "delete", "publish", "archive"]),
  ...crud("courseModule", "course modules"),
  ...crud("lesson", "lessons"),
  ...crud("attachment", "attachments", ["create", "read", "delete"]),
  ...crud("resource", "learning resources"),
  ...crud("sop", "SOPs", ["create", "read", "update", "delete", "approve"]),
  ...crud("kb", "knowledge base articles"),
  ...crud("tag", "tags", ["create", "read", "delete"]),
  ...crud("question", "questions"),
  ...crud("assessment", "assessments", ["create", "read", "update", "delete", "attempt", "grade"]),
  ...crud("assignment", "assignments", ["create", "read", "update", "delete", "submit", "grade"]),
  ...crud("competency", "competencies"),
  ...crud("certification", "certifications"),
  ...crud("certificate", "issued certificates", ["read", "issue", "revoke"]),
  ...crud("learningPath", "learning paths"),
  ...crud("enrollment", "enrollments", ["create", "read", "delete"]),
  ...crud("progress", "progress records", ["read"]),
  ...crud("notification", "notifications", ["read", "update"]),
  ...crud("report", "reports", ["view", "export"]),
  ...crud("audit", "audit log", ["read"]),
  ...crud("settings", "system settings", ["manage"]),
  { key: "admin.access", resource: "admin", action: "access", description: "Access the admin console" },
];

export const PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((p) => p.key);

/** Default permission bundles for the 10 baseline roles from the product brief. */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[] | "*"> = {
  "Super Administrator": "*",
  "Managing Director": [
    "user.read",
    "department.read",
    "employeeProfile.read",
    "academy.read",
    "course.read",
    "courseModule.read",
    "lesson.read",
    "certification.read",
    "certificate.read",
    "competency.read",
    "report.view",
    "report.export",
    "audit.read",
    "admin.access",
  ],
  "Creative Director": [
    "academy.create", "academy.read", "academy.update", "academy.publish", "academy.archive",
    "course.create", "course.read", "course.update", "course.publish", "course.archive",
    "courseModule.create", "courseModule.read", "courseModule.update", "courseModule.delete",
    "lesson.create", "lesson.read", "lesson.update", "lesson.delete",
    "resource.create", "resource.read", "resource.update", "resource.delete",
    "kb.create", "kb.read", "kb.update",
    "tag.create", "tag.read",
    "attachment.create", "attachment.read", "attachment.delete",
    "admin.access",
  ],
  "Academy Administrator": [
    "academy.create", "academy.read", "academy.update", "academy.publish", "academy.archive",
    "course.create", "course.read", "course.update", "course.delete", "course.publish", "course.archive",
    "courseModule.create", "courseModule.read", "courseModule.update", "courseModule.delete",
    "lesson.create", "lesson.read", "lesson.update", "lesson.delete",
    "resource.create", "resource.read", "resource.update", "resource.delete",
    "attachment.create", "attachment.read", "attachment.delete",
    "learningPath.create", "learningPath.read", "learningPath.update",
    "enrollment.create", "enrollment.read", "enrollment.delete",
    "progress.read",
    "admin.access",
  ],
  "HR Administrator": [
    "user.create", "user.read", "user.update", "user.invite",
    "department.create", "department.read", "department.update", "department.delete",
    "position.create", "position.read", "position.update", "position.delete",
    "employeeProfile.read", "employeeProfile.update",
    "competency.read",
    "certification.read", "certificate.read",
    "report.view", "report.export",
    "admin.access",
  ],
  "Department Manager": [
    "employeeProfile.read",
    "progress.read",
    "report.view",
    "assignment.grade",
    "assessment.grade",
    "course.read", "lesson.read",
    "admin.access",
  ],
  "Trainer": [
    "course.read", "courseModule.read",
    "lesson.read", "lesson.update",
    "question.create", "question.read", "question.update",
    "assignment.grade", "assessment.grade",
    "sop.read", "kb.read",
    "admin.access",
  ],
  "Assessor": [
    "assessment.read", "assessment.grade",
    "assignment.read", "assignment.grade",
    "question.read",
    "certificate.issue",
    "admin.access",
  ],
  "Employee": [
    "academy.read",
    "course.read", "courseModule.read", "lesson.read",
    "resource.read",
    "assessment.read", "assessment.attempt",
    "assignment.read", "assignment.submit",
    "sop.read", "kb.read",
    "certificate.read",
    "employeeProfile.read", "employeeProfile.update",
    "progress.read",
    "notification.read", "notification.update",
  ],
  "Guest": ["kb.read", "academy.read", "course.read"],
};
