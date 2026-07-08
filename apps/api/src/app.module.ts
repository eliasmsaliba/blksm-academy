import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

import { AuthModule } from "./modules/auth/auth.module";
import { RbacModule } from "./modules/rbac/rbac.module";
import { UsersModule } from "./modules/users/users.module";
import { OrgModule } from "./modules/org/org.module";
import { AcademiesModule } from "./modules/academies/academies.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { CourseModulesModule } from "./modules/course-modules/course-modules.module";
import { LessonsModule } from "./modules/lessons/lessons.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { EnrollmentModule } from "./modules/enrollment/enrollment.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { QuestionsModule } from "./modules/questions/questions.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { CompetenciesModule } from "./modules/competencies/competencies.module";
import { CertificationsModule } from "./modules/certifications/certifications.module";
import { LearningPathsModule } from "./modules/learning-paths/learning-paths.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RbacModule,
    UsersModule,
    OrgModule,
    AcademiesModule,
    CoursesModule,
    CourseModulesModule,
    LessonsModule,
    AttachmentsModule,
    EnrollmentModule,
    ProgressModule,
    // Phase 2 stubs — Prisma models exist, API/UI not yet built.
    QuestionsModule,
    AssessmentsModule,
    AssignmentsModule,
    CompetenciesModule,
    CertificationsModule,
    LearningPathsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
