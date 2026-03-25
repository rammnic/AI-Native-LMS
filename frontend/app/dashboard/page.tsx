"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Clock, Sparkles, LogOut, User } from "lucide-react";
import { coursesApi, progressApi, CourseProgressResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CreateCourseModal } from "@/components/create-course-modal";

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Array<{ id: string; title: string; description: string; status: string }>>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgressResponse>>({});
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const coursesData = await coursesApi.getAll();
        setCourses(coursesData);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
      }
    }
    if (isAuthenticated) {
      fetchData();
    } else if (!loading) {
      setLoading(false);
    }
  }, [isAuthenticated, loading]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCourseCreated = (courseId: string) => {
    coursesApi.getAll().then(setCourses).catch(console.error);
  };

  useEffect(() => {
    async function loadProgress() {
      const progressPromises = courses.map(async (course) => {
        try {
          const progress = await progressApi.getCourseProgress(course.id);
          return { courseId: course.id, progress };
        } catch {
          return { courseId: course.id, progress: null };
        }
      });

      const results = await Promise.all(progressPromises);
      const progressMap: Record<string, CourseProgressResponse> = {};
      results.forEach(({ courseId, progress }) => {
        if (progress) {
          progressMap[courseId] = progress;
        }
      });
      setCourseProgress(progressMap);
    }

    if (courses.length > 0) {
      loadProgress();
    }
  }, [courses]);

  const getProgressPercent = (courseId: string): number => {
    const progress = courseProgress[courseId];
    if (!progress || progress.total_count === 0) return 0;
    return Math.round((progress.completed_count / progress.total_count) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="text-xl font-bold">AI-Native LMS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center font-medium">
                {user?.name?.[0] || "U"}
              </div>
              <span className="text-sm">{user?.name || "Пользователь"}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
            <p className="text-slate-400">С возвращением!</p>
          </div>
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-xl font-medium"
          >
            <Plus className="w-5 h-5" />
            Создать новый курс
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">{courses.length}</p>
                <p className="text-slate-400">Активных курсов</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-slate-400">Уроков пройдено</p>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">5ч</p>
                <p className="text-slate-400">Время обучения</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-6">Ваши курсы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 text-xs rounded-md bg-violet-500/20 text-violet-300">
                  {course.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{course.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercent(course.id)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400 w-10 text-right">
                  {getProgressPercent(course.id)}%
                </span>
              </div>
            </Link>
          ))}
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="p-6 rounded-2xl border-2 border-dashed border-slate-800 hover:border-violet-500/50 transition-colors flex flex-col items-center justify-center gap-3 min-h-[200px]"
          >
            <Plus className="w-6 h-6 text-slate-400" />
            <span className="text-slate-400">Создать новый курс</span>
          </button>
        </div>
      </main>

      <CreateCourseModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onCourseCreated={handleCourseCreated}
      />
    </div>
  );
}