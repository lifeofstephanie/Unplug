"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "math",
    level: "beginner",
    language: "en",
    emoji: "📚",
    color: "#2C5EAD",
  });

  const subjects = ["math", "science", "literacy", "health", "agriculture", "technology", "civics"];
  const levels = ["beginner", "intermediate", "advanced"];
  const languages = [{ code: "en", name: "English" }, { code: "sw", name: "Swahili" }, { code: "fr", name: "French" }];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/courses", formData);
      router.push(`/dashboard/courses/${res.data.course._id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create course");
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    if (!formData.title) {
      setError("Please enter a course title first so AI knows what to generate.");
      return;
    }
    
    setAiGenerating(true);
    setError("");
    
    try {
      const promptText = `Generate a comprehensive description, subject category, difficulty level, appropriate emoji, and theme color (hex) for a course titled "${formData.title}".`;
      
      const res = await api.post("/ai/generate-outline", {
        topic: formData.title,
        targetAudience: "Students with limited internet access"
      });
      
      // If the backend returned a structured JSON as requested in aiController
      if (res.data.outline) {
        // Typically the outline would just be text right now based on our backend code,
        // but let's assume it populates the description at least.
        setFormData(prev => ({
          ...prev,
          description: typeof res.data.outline === 'string' ? res.data.outline : JSON.stringify(res.data.outline, null, 2)
        }));
      }
    } catch (err: any) {
      setError("AI generation failed. Please fill details manually.");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/courses"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 dark:bg-[#0f172a] dark:text-gray-400 dark:border-gray-800 dark:border dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create New Course
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define the basic details for your offline learning bundle.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f172a]">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-900 dark:text-white">
                Course Title <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                  placeholder="e.g., Introduction to Algebra"
                />
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={aiGenerating}
                  className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-4 py-2 text-sm font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2 disabled:opacity-50 dark:border-[var(--color-brand-800)] dark:bg-[var(--color-brand-900)/30 dark:text-[var(--color-brand-300)]"
                >
                  {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Auto-fill Info
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-900 dark:text-white">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                placeholder="What will students learn?"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-gray-900 dark:text-white">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white capitalize"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="level" className="text-sm font-medium text-gray-900 dark:text-white">
                Level
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white capitalize"
              >
                {levels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium text-gray-900 dark:text-white">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="emoji" className="text-sm font-medium text-gray-900 dark:text-white">
                Emoji Icon
              </label>
              <input
                type="text"
                id="emoji"
                name="emoji"
                value={formData.emoji}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50 dark:text-white text-2xl text-center"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="color" className="text-sm font-medium text-gray-900 dark:text-white">
                Theme Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="block h-12 w-16 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-1 focus:border-[var(--color-brand-500)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-500)] dark:border-gray-700 dark:bg-gray-900/50"
                />
                <input
                  type="text"
                  value={formData.color}
                  readOnly
                  className="block w-full rounded-xl border border-gray-200 bg-gray-100 p-3 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/dashboard/courses"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-brand-700)] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-gray-900 transition-all transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
