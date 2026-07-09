import { CheckCircle2, Quote, Sparkles } from "lucide-react";
import { KnowledgeCheck } from "./knowledge-check";

interface StructuredContent {
  format: "structured-v1";
  lessonCode?: string;
  competenciesDeveloped?: string[];
  introduction?: string;
  learningOutcomes?: string[];
  leadershipThought?: string;
  sections?: { heading: string; body: string }[];
  reflection?: string;
}

export function StructuredLessonContent({
  content,
  lessonId,
  estimatedDurationMinutes,
}: {
  content: StructuredContent;
  lessonId: string;
  estimatedDurationMinutes?: number;
}) {
  return (
    <div className="space-y-6">
      {(content.lessonCode || estimatedDurationMinutes || content.competenciesDeveloped?.length) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          {content.lessonCode && <span className="font-mono">{content.lessonCode}</span>}
          {estimatedDurationMinutes && <span>{estimatedDurationMinutes} minutes</span>}
          {content.competenciesDeveloped?.map((c) => (
            <span key={c} className="rounded-full bg-slate-200 px-2 py-0.5">
              {c}
            </span>
          ))}
        </div>
      )}

      {content.introduction && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{content.introduction}</p>
      )}

      {content.learningOutcomes && content.learningOutcomes.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Learning Outcomes</h3>
          <ul className="space-y-1.5">
            {content.learningOutcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.leadershipThought && (
        <div className="flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <Quote size={18} className="mt-0.5 shrink-0 text-indigo-500" />
          <p className="text-sm italic text-indigo-900">{content.leadershipThought}</p>
        </div>
      )}

      {content.sections?.map((section, i) => (
        <div key={i}>
          {section.heading && <h3 className="mb-2 text-sm font-semibold text-slate-900">{section.heading}</h3>}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{section.body}</p>
        </div>
      ))}

      <KnowledgeCheck lessonId={lessonId} />

      {content.reflection && (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <p className="text-sm italic text-emerald-900">{content.reflection}</p>
        </div>
      )}
    </div>
  );
}
