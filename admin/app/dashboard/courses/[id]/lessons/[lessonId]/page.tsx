"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../../../lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function LessonEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // CSV Upload state
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLessonAndCourse = async () => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      const courseData = res.data.course;
      setCourseTitle(courseData.title);

      const foundLesson = courseData.lessons.find(
        (l: any) => l._id === lessonId,
      );
      if (foundLesson) {
        setLesson(foundLesson);
      } else {
        router.push(`/dashboard/courses/${courseId}`);
      }
    } catch (err) {
      console.error(err);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && lessonId) fetchLessonAndCourse();
  }, [courseId, lessonId]);

  const handleLessonChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setLesson((prev: any) => ({ ...prev, [name]: value }));
  };

  const saveLesson = async () => {
    setSaving(true);
    try {
      await api.put(`/lessons/${courseId}/${lessonId}`, {
        title: lesson.title,
        content: lesson.content,
        type: lesson.type,
      });
      alert("Lesson saved successfully");
    } catch (err: any) {
      console.error("saveLesson error:", err?.response?.data || err?.message);
      alert("Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const generateAiQuestions = async () => {
    if (!lesson.content || lesson.content.length < 50) {
      alert(
        "Please add some lesson content first so the AI has context to generate questions.",
      );
      return;
    }

    setAiGenerating(true);
    try {
      const res = await api.post(`/ai/generate-questions`, {
        lessonContent: lesson.content,
        // count: 5,
        level: "beginner",
      });

      if (res.data.questions && res.data.questions.length > 0) {
        // Save them to the backend immediately
        await api.post(`/lessons/${courseId}/${lessonId}/questions`, {
          questions: res.data.questions,
        });
        await fetchLessonAndCourse(); // Refresh local state to show new questions
        alert(`Successfully generated ${res.data.questions.length} questions!`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to generate questions");
      console.log(err.response?.data?.error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCsv(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(
        `/lessons/${courseId}/${lessonId}/upload-questions`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      await fetchLessonAndCourse();
      alert("Questions uploaded successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "CSV upload failed");
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading || !lesson) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 dark:bg-[#0f172a] dark:text-gray-400 dark:border-gray-800 dark:border dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-medium text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]">
              {courseTitle}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Edit Lesson
            </h1>
          </div>
        </div>
        <button
          onClick={saveLesson}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--color-brand-700)] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2 disabled:opacity-70 transition-all transform active:scale-95"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f172a] space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Lesson Title
              </label>
              <input
                type="text"
                name="title"
                value={lesson.title}
                onChange={handleLessonChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-lg font-medium text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white flex justify-between">
                <span>Content (Text/Markdown)</span>
              </label>
              <textarea
                name="content"
                rows={15}
                value={lesson.content}
                onChange={handleLessonChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-relaxed text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200"
                placeholder="# Introduction\nWrite your lesson content here..."
              />
            </div>
          </div>
        </div>

        {/* Right Column - Quiz Management */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0f172a] overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
                Quiz Questions
                <span className="rounded-full bg-[var(--color-brand-100)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-300)]">
                  {lesson.quiz?.length || 0}
                </span>
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={generateAiQuestions}
                disabled={aiGenerating || !lesson.content}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-brand-300)] bg-[var(--color-brand-50)] p-3 text-sm font-semibold text-[var(--color-brand-700)] transition-colors hover:bg-[var(--color-brand-100)] disabled:opacity-50 dark:border-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)/30 dark:text-[var(--color-brand-400)] dark:hover:bg-[var(--color-brand-800)/50"
              >
                {aiGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate with AI
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">
                  OR
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleCsvUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCsv}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {uploadingCsv ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload CSV
              </button>

              <div className="mt-6 space-y-3 max-h-96 overflow-y-auto pr-2">
                {lesson.quiz?.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    No questions yet. Use AI or CSV to add them.
                  </div>
                ) : (
                  lesson.quiz?.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
                    >
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-300)]">
                          {i + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {q.question}
                        </p>
                      </div>
                      <div className="mt-2 pl-7 space-y-1">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className="flex items-center gap-2 text-xs"
                          >
                            {q.correctIndex === optIdx ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded-full border border-gray-300 dark:border-gray-600" />
                            )}
                            <span
                              className={
                                q.correctIndex === optIdx
                                  ? "font-medium text-emerald-700 dark:text-emerald-400"
                                  : "text-gray-500"
                              }
                            >
                              {opt}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
