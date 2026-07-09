import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async getModuleSummary(courseModuleId: string, userId: string) {
    const assignment = await this.prisma.assignment.findFirst({ where: { courseModuleId } });
    if (!assignment) return null;

    const mySubmission = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId: assignment.id, userId } },
    });

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      maxPoints: assignment.maxPoints,
      rubric: assignment.rubric,
      mySubmission: mySubmission
        ? {
            id: mySubmission.id,
            content: mySubmission.content,
            submittedAt: mySubmission.submittedAt,
            status: mySubmission.status,
            grade: mySubmission.grade,
            feedback: mySubmission.feedback,
          }
        : null,
    };
  }

  async findByModuleAdmin(courseModuleId: string) {
    return this.prisma.assignment.findFirst({
      where: { courseModuleId },
      include: { submissions: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
  }

  async create(dto: CreateAssignmentDto, userId: string) {
    const existing = await this.prisma.assignment.findFirst({ where: { courseModuleId: dto.courseModuleId } });
    if (existing) throw new ConflictException("This module already has a Practical Assignment");

    return this.prisma.assignment.create({
      data: {
        courseModuleId: dto.courseModuleId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxPoints: dto.maxPoints ?? 100,
        rubric: dto.rubric ? { text: dto.rubric } : undefined,
        status: "PUBLISHED",
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdateAssignmentDto) {
    await this.findOrThrow(id);
    return this.prisma.assignment.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxPoints: dto.maxPoints,
        rubric: dto.rubric !== undefined ? { text: dto.rubric } : undefined,
      },
    });
  }

  async submit(assignmentId: string, dto: CreateSubmissionDto, userId: string) {
    await this.findOrThrow(assignmentId);
    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId } },
    });
    if (existing && existing.status !== "SUBMITTED") {
      throw new BadRequestException("This assignment has already been graded and cannot be resubmitted");
    }

    return this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      create: { assignmentId, userId, content: dto.content },
      update: { content: dto.content, submittedAt: new Date() },
    });
  }

  async listPendingGrading() {
    return this.prisma.assignmentSubmission.findMany({
      where: { status: "SUBMITTED" },
      include: {
        assignment: { select: { id: true, title: true, courseModuleId: true, maxPoints: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { submittedAt: "asc" },
    });
  }

  async getSubmissionForGrading(submissionId: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        comments: { include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!submission) throw new NotFoundException("Submission not found");
    return submission;
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto, graderId: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException("Submission not found");

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { grade: dto.grade, feedback: dto.feedback, gradedById: graderId, status: "GRADED" },
    });
  }

  async addComment(submissionId: string, dto: CreateCommentDto, authorId: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException("Submission not found");

    return this.prisma.assignmentComment.create({
      data: { submissionId, authorId, body: dto.body },
    });
  }

  private async findOrThrow(id: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");
    return assignment;
  }
}
