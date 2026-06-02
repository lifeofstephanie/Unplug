"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  BookOpen, 
  Clock, 
  Globe,
  Loader2,
  Trash2,
  Edit,
  Eye,
  EyeOff
} from "lucide-react";

interface Course {
  _id: string;
  title: string;
  subject: string;
  level: string;
  language: string;
  emoji: string;
  color: string;
  isPublished: boolean;
  totalLessons: number;
  estimatedHours: number;
  downloadSizeKb: number;
  createdAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCourses = async (p = 1, search = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/courses?page=${p}&limit=10${search ? `&search=${search}` : ""}`);
      if (res.data.courses) {
        setCourses(res.data.courses);
        setTotalPages(res.data.pagination?.pages || 1);
        setPage(res.data.pagination?.page || 1);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchCourses(1, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const togglePublish = async (id: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await api.put(`/courses/${id}/unpublish`);
      } else {
        await api.put(`/courses/${id}/publish`);
      }
      // Optimistic update
      setCourses(courses.map(c => c._id === id ? { ...c, isPublished: !isPublished } : c));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update publish status. Does the course have lessons?");
    }
  };

  const deleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c._id !== id));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Courses
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your offline learning bundles
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--color-brand-700)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-brand-800)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:ring-offset-2 transition-all transform active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center rounded-2xl bg-white p-2 shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-[#0f172a]">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border-none bg-transparent py-2 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-white"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Course List */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0f172a]">
        {loading && courses.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No courses</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new course.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {courses.map((course) => (
              <li key={course._id} className="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 gap-4">
                    <div 
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm"
                      style={{ backgroundColor: course.color + '20' }}
                    >
                      {course.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/courses/${course._id}`} className="truncate text-sm font-bold text-gray-900 hover:text-[var(--color-brand-600)] dark:text-white dark:hover:text-[var(--color-brand-400)] transition-colors">
                          {course.title}
                        </Link>
                        {course.isPublished ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize font-medium">{course.subject}</span>
                        <span>•</span>
                        <span className="capitalize">{course.level}</span>
                        <span>•</span>
                        <span className="flex items-center"><BookOpen className="mr-1 h-3 w-3" /> {course.totalLessons} lessons</span>
                        <span className="hidden sm:flex items-center"><Globe className="mr-1 h-3 w-3" /> {course.language.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => togglePublish(course._id, course.isPublished)}
                      className="hidden sm:flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors tooltip"
                      title={course.isPublished ? "Unpublish" : "Publish"}
                    >
                      {course.isPublished ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <Link
                      href={`/dashboard/courses/${course._id}`}
                      className="flex items-center justify-center p-2 text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] dark:text-[var(--color-brand-400)] dark:hover:text-[var(--color-brand-300)] transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button 
                      onClick={() => deleteCourse(course._id)}
                      className="flex items-center justify-center p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#090e17] sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => fetchCourses(page - 1, searchQuery)}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchCourses(page + 1, searchQuery)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
