const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(", ") : body.message ?? message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: { id: string; name: string }[];
  permissions: string[];
}

export const authApi = {
  login: (email: string, password: string) =>
    post<{ user: unknown }>("/auth/login", { email, password }),
  logout: () => post("/auth/logout"),
  me: () => get<AuthUser>("/auth/me"),
};

export const usersApi = {
  list: () => get<any[]>("/users"),
  get: (id: string) => get<any>(`/users/${id}`),
  create: (data: unknown) => post<any>("/users", data),
  update: (id: string, data: unknown) => patch<any>(`/users/${id}`, data),
  assignRole: (id: string, roleId: string) => post<any>(`/users/${id}/roles`, { roleId }),
  revokeRole: (id: string, roleId: string) => del<any>(`/users/${id}/roles/${roleId}`),
  delete: (id: string) => del<{ success: boolean }>(`/users/${id}`),
};

export const rolesApi = {
  list: () => get<any[]>("/roles"),
  get: (id: string) => get<any>(`/roles/${id}`),
  listPermissions: () => get<any[]>("/roles/permissions"),
  create: (data: unknown) => post<any>("/roles", data),
  setPermissions: (id: string, permissionKeys: string[]) =>
    put<any>(`/roles/${id}/permissions`, { permissionKeys }),
  delete: (id: string) => del<{ success: boolean }>(`/roles/${id}`),
};

export const departmentsApi = {
  list: () => get<any[]>("/departments"),
  get: (id: string) => get<any>(`/departments/${id}`),
  create: (data: unknown) => post<any>("/departments", data),
  update: (id: string, data: unknown) => patch<any>(`/departments/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/departments/${id}`),
};

export const positionsApi = {
  list: () => get<any[]>("/positions"),
  create: (data: unknown) => post<any>("/positions", data),
  delete: (id: string) => del<{ success: boolean }>(`/positions/${id}`),
};

export const academiesApi = {
  list: () => get<any[]>("/academies"),
  get: (id: string) => get<any>(`/academies/${id}`),
  create: (data: unknown) => post<any>("/academies", data),
  update: (id: string, data: unknown) => patch<any>(`/academies/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/academies/${id}`),
};

export const coursesApi = {
  listByAcademy: (academyId: string) => get<any[]>(`/courses?academyId=${academyId}`),
  get: (id: string) => get<any>(`/courses/${id}`),
  create: (data: unknown) => post<any>("/courses", data),
  update: (id: string, data: unknown) => patch<any>(`/courses/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/courses/${id}`),
};

export const courseModulesApi = {
  listByCourse: (courseId: string) => get<any[]>(`/course-modules?courseId=${courseId}`),
  get: (id: string) => get<any>(`/course-modules/${id}`),
  create: (data: unknown) => post<any>("/course-modules", data),
  update: (id: string, data: unknown) => patch<any>(`/course-modules/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/course-modules/${id}`),
};

export const lessonsApi = {
  listByModule: (courseModuleId: string) => get<any[]>(`/lessons?courseModuleId=${courseModuleId}`),
  get: (id: string) => get<any>(`/lessons/${id}`),
  create: (data: unknown) => post<any>("/lessons", data),
  update: (id: string, data: unknown) => patch<any>(`/lessons/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/lessons/${id}`),
};

export const attachmentsApi = {
  listForEntity: (attachableType: string, attachableId: string) =>
    get<any[]>(`/attachments?attachableType=${attachableType}&attachableId=${attachableId}`),
  upload: (file: File, attachableType: string, attachableId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("attachableType", attachableType);
    formData.append("attachableId", attachableId);
    return request<any>("/attachments", { method: "POST", body: formData });
  },
  downloadUrl: (id: string) => `${API_URL}/attachments/${id}/download`,
  delete: (id: string) => del<{ success: boolean }>(`/attachments/${id}`),
};

export const enrollmentApi = {
  mine: () => get<any[]>("/enrollments/me"),
  forUser: (userId: string) => get<any[]>(`/enrollments/user/${userId}`),
  enrollSelf: (enrollableType: string, enrollableId: string) =>
    post<any>("/enrollments/me", { enrollableType, enrollableId }),
  create: (data: unknown) => post<any>("/enrollments", data),
  delete: (id: string) => del<{ success: boolean }>(`/enrollments/${id}`),
};

export const progressApi = {
  myCourseProgress: (courseId: string) => get<any>(`/progress/courses/${courseId}/me`),
  setLessonProgress: (lessonId: string, data: unknown) =>
    put<any>(`/progress/lessons/${lessonId}`, data),
};

export const questionsApi = {
  list: (questionType?: string) => get<any[]>(`/questions${questionType ? `?questionType=${questionType}` : ""}`),
  get: (id: string) => get<any>(`/questions/${id}`),
  create: (data: unknown) => post<any>("/questions", data),
  update: (id: string, data: unknown) => patch<any>(`/questions/${id}`, data),
};

export const assessmentsApi = {
  // Learner-safe
  getByLesson: (lessonId: string) => get<any>(`/assessments/lesson/${lessonId}`),
  startAttempt: (lessonId: string) => post<any>(`/assessments/lesson/${lessonId}/attempts`),
  getByModule: (moduleId: string) => get<any>(`/assessments/module/${moduleId}`),
  startModuleAttempt: (moduleId: string) => post<any>(`/assessments/module/${moduleId}/attempts`),
  submitAttempt: (attemptId: string, data: unknown) => post<any>(`/assessments/attempts/${attemptId}/submit`, data),
  // Admin
  getByLessonAdmin: (lessonId: string) => get<any>(`/assessments/lesson/${lessonId}/manage`),
  getByModuleAdmin: (moduleId: string) => get<any>(`/assessments/module/${moduleId}/manage`),
  create: (data: unknown) => post<any>("/assessments", data),
  update: (id: string, data: unknown) => patch<any>(`/assessments/${id}`, data),
  addQuestion: (assessmentId: string, data: unknown) => post<any>(`/assessments/${assessmentId}/questions`, data),
  removeQuestion: (assessmentId: string, questionId: string) =>
    del<{ success: boolean }>(`/assessments/${assessmentId}/questions/${questionId}`),
  // Grading (Assessor / Trainer / Department Manager)
  listGrading: () => get<any[]>("/assessments/grading"),
  getGradingDetail: (attemptId: string) => get<any>(`/assessments/grading/${attemptId}`),
  gradeAnswer: (attemptId: string, answerId: string, data: unknown) =>
    post<any>(`/assessments/grading/${attemptId}/answers/${answerId}`, data),
  finalizeAttempt: (attemptId: string) => post<any>(`/assessments/grading/${attemptId}/finalize`),
};

export const assignmentsApi = {
  // Learner-safe
  getByModule: (moduleId: string) => get<any>(`/assignments/module/${moduleId}`),
  submit: (assignmentId: string, data: unknown) => post<any>(`/assignments/${assignmentId}/submissions`, data),
  // Admin
  getByModuleAdmin: (moduleId: string) => get<any>(`/assignments/module/${moduleId}/manage`),
  create: (data: unknown) => post<any>("/assignments", data),
  update: (id: string, data: unknown) => patch<any>(`/assignments/${id}`, data),
  // Grading (Assessor / Trainer / Department Manager)
  listGrading: () => get<any[]>("/assignments/grading"),
  getGradingDetail: (submissionId: string) => get<any>(`/assignments/grading/${submissionId}`),
  gradeSubmission: (submissionId: string, data: unknown) => post<any>(`/assignments/grading/${submissionId}/grade`, data),
  addComment: (submissionId: string, data: unknown) => post<any>(`/assignments/submissions/${submissionId}/comments`, data),
};
