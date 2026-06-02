"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Save,
  BookOpen,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Create lesson modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [createError, setCreateError] = useState("");

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.course);
    } catch (err: any) {
      console.error(
        "fetchCourse error:",
        err?.response?.data || err?.message || err,
      );
      setError("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !course) return;

    const items = Array.from(course.lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for snappy UI
    setCourse({ ...course, lessons: items });

    // Prepare payload for backend (lessonId, order)
    const lessonOrder = items.map((lesson: any, index) => ({
      lessonId: lesson._id,
      order: index + 1,
    }));

    try {
      await api.put(`/lessons/${id}/reorder`, { lessonOrder });
    } catch (err) {
      alert("Failed to save new order.");
      fetchCourse(); // Revert on failure
    }
  };

  const createLesson = () => {
    setNewLessonTitle("");
    setNewLessonContent("");
    setCreateError("");
    setIsCreateModalOpen(true);
  };

  const submitCreateLesson = async () => {
    if (!newLessonTitle.trim() || !newLessonContent.trim()) {
      setCreateError("Title and content are required.");
      return;
    }

    setSaving(true);
    setCreateError("");
    try {
      await api.post(`/lessons/${id}`, { 
        title: newLessonTitle, 
        type: "text", 
        content: newLessonContent 
      });
      fetchCourse();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(
        err?.response?.data?.error || err?.message || "Failed to create lesson"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await api.delete(`/lessons/${id}/${lessonId}`);
      fetchCourse();
    } catch (err: any) {
      console.error(
        "deleteLesson error:",
        err?.response?.data || err?.message || err,
      );
      alert(
        `Failed to delete lesson: ${err?.response?.data?.error || err?.message}`,
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-medium">Error loading course</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => router.push("/dashboard/courses")}
          className="mt-4 underline"
        >
          Back to courses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/courses"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 dark:bg-[#0f172a] dark:text-gray-400 dark:border-gray-800 dark:border dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span
                className="text-2xl"
                style={{
                  backgroundColor: course.color + "20",
                  padding: "4px",
                  borderRadius: "8px",
                }}
              >
                {course.emoji}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {course.title}
              </h1>
            </div>
          </div>
        </div>
        <button
          onClick={createLesson}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-[var(--color-brand-700)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2 disabled:opacity-70 transition-all transform active:scale-95"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Lesson
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Curriculum
            </h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
              {course.lessons.length} lessons
            </span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#0f172a]">
            {course.lessons.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No lessons yet.
                </p>
                <button
                  onClick={createLesson}
                  className="mt-2 text-sm font-medium text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
                >
                  Add your first lesson
                </button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="lessons">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {course.lessons.map((lesson: any, index: number) => (
                        <Draggable
                          key={lesson._id}
                          draggableId={lesson._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                                snapshot.isDragging
                                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)/20 shadow-md"
                                  : "border-gray-100 bg-white dark:border-gray-800 dark:bg-[#0f172a]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-300)]">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 mr-2">
                                  {lesson.quiz?.length || 0} questions
                                </span>
                                <Link
                                  href={`/dashboard/courses/${course._id}/lessons/${lesson._id}`}
                                  className="p-2 text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] dark:text-[var(--color-brand-400)] dark:hover:text-[var(--color-brand-300)]"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => deleteLesson(lesson._id)}
                                  className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>

        {/* Right Col - Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Details
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0f172a] space-y-4">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                Subject
              </span>
              <span className="mt-1 block font-medium capitalize text-gray-900 dark:text-white">
                {course.subject}
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                Level
              </span>
              <span className="mt-1 block font-medium capitalize text-gray-900 dark:text-white">
                {course.level}
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </span>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New Lesson</h3>
            {createError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {createError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Lesson Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={newLessonContent}
                  onChange={(e) => setNewLessonContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Lesson Content"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitCreateLesson}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-brand-700)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-800)] disabled:opacity-70"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
