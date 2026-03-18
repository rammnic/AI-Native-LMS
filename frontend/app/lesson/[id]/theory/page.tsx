"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, BookOpen, RefreshCw, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmartConsole } from "@/components/smart-console"
import { aiApi } from "@/lib/api"

interface LessonData {
  id: string
  title: string
  content: string
  course_id: string
  parent_context?: string
}

export default function TheoryPage() {
  const params = useParams()
  const lessonId = params.id as string
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    async function fetchLesson() {
      try {
        // Mock data for demo - in real app would fetch from API
        const mockLesson: LessonData = {
          id: lessonId,
          title: "What is Python?",
          course_id: "demo-course-1",
          parent_context: "User is learning Python basics",
          content: `# What is Python?

Python is a high-level, interpreted programming language known for its simplicity and readability.

## Why Python?

- **Easy to Learn**: Python has a clean syntax that reads like English
- **Versatile**: Used in web development, data science, AI, automation, and more
- **Large Community**: Extensive libraries and active community support
- **Cross-Platform**: Works on Windows, Mac, Linux, and other platforms

## Your First Python Program

The classic "Hello, World!" program in Python is incredibly simple:

\`\`\`python
print("Hello, World!")
\`\`\`

This single line tells Python to display the text "Hello, World!" on the screen.

## Key Features

1. **Interpreted**: No compilation needed - Python runs line by line
2. **Dynamic**: No need to declare variable types
3. **Object-Oriented**: Supports OOP concepts
4. **Extensive Libraries**: From web frameworks to scientific computing

> "Python is the second best language for everything." - Unknown

In the next lesson, you'll learn about variables and data types in Python.`,
        }
        setLesson(mockLesson)
      } catch (error) {
        console.error("Error fetching lesson:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [lessonId])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const result = await aiApi.generateContent(
        { node_id: lessonId, course_id: lesson?.course_id || "", title: lesson?.title || "", parent_context: lesson?.parent_context || "" },
        "theory"
      )
      if (result.success) {
        const data = result.data as { content: string }
        setLesson((prev) => prev ? { ...prev, content: data.content } : null)
      }
    } catch (error) {
      console.error("Error regenerating:", error)
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!lesson) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Lesson not found</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-80">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-30">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/course/${lesson.course_id}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <div>
                <h1 className="text-lg font-semibold">{lesson.title}</h1>
                <p className="text-sm text-slate-400">Theory</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
            <Link href={`/lesson/${lessonId}/practice`}>
              <Button size="sm">
                Go to Practice
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <article className="prose prose-invert prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 text-white">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-white">{children}</h3>,
              p: ({ children }) => <p className="text-slate-300 mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
              code: ({ children, className }) => {
                const isInline = !className
                if (isInline) {
                  return <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 text-sm">{children}</code>
                }
                return (
                  <pre className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
                    <code className="text-sm text-slate-200">{children}</code>
                  </pre>
                )
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-violet-500 pl-4 py-2 my-4 text-slate-400 italic">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            }}
          >
            {lesson.content}
          </ReactMarkdown>
        </article>
      </main>

      {/* Smart Console */}
      <SmartConsole
        nodeId={lessonId}
        courseId={lesson.course_id}
        context={lesson.parent_context || ""}
      />
    </div>
  )
}