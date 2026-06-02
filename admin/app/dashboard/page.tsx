"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { 
  Users, 
  BookOpen, 
  Download, 
  Activity, 
  TrendingUp,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCourses: number;
    publishedCourses: number;
    totalDownloads: number;
    totalProgressEvents: number;
  };
  topCourses: Array<{
    courseId: string;
    title: string;
    subject: string;
    downloads: number;
  }>;
  completionRates: Array<{
    courseId: string;
    title: string;
    completions: number;
  }>;
  quizStats: {
    averageScore: number;
    totalQuizzesTaken: number;
  };
}

export default function DashboardOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/admin/analytics");
        setData(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-500)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: data.overview.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Downloads",
      value: data.overview.totalDownloads,
      icon: Download,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Published Courses",
      value: `${data.overview.publishedCourses} / ${data.overview.totalCourses}`,
      icon: BookOpen,
      color: "text-[var(--color-brand-600)]",
      bg: "bg-[var(--color-brand-100)] dark:bg-[var(--color-brand-900)]",
    },
    {
      title: "Avg Quiz Score",
      value: `${data.quizStats.averageScore}%`,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Analytics and activity for the Unplug platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md dark:border-gray-800 dark:bg-[#0f172a]"
          >
            <div className={`mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Downloaded Courses Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f172a]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Top Downloads
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Most downloaded offline courses
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-72 w-full">
            {data.topCourses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCourses} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="title" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="downloads" 
                    fill="var(--color-brand-500)" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No download data yet.
              </div>
            )}
          </div>
        </div>

        {/* Completion Rates */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f172a]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Course Completions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Number of times a course was fully completed
              </p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-72 w-full">
            {data.completionRates.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.completionRates} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="title" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completions" 
                    stroke="var(--color-brand-600)" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No completion data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
