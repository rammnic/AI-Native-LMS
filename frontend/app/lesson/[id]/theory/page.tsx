"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, BookOpen, RefreshCw, Sparkles, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmartConsole } from "@/components/smart-console"
import { aiApi, nodesApi, CourseNode } from "@/lib/api"

interface LessonData {
  id: string
  title: string
  content: string
  course_id: string
  parent_context?: string
  content_status: string
}

export default function TheoryPage() {
  const params = useParams()
  const lessonId = params.id as string
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function fetchLesson() {
      try {
        // Fetch node from API
        const node = await nodesApi.getById(lessonId)
        
        // If content is pending, generate it
        if (node.content_status === "pending" || !node.content) {
          setGenerating(true)
          try {
            const result = await aiApi.generateContent(
              { node_id: lessonId, course_id: node.course_id || "", title: node.title, parent_context: node.data?.parent_context || "" },
              "theory"
            )
            if (result.success) {
              const data = result.data as { content: string }
              setLesson({
                id: node.id,
                title: node.title,
                content: data.content || "# Content pending generation...",
                course_id: node.course_id || "",
                parent_context: node.data?.parent_context as string || "",
                content_status: "generated",
              })
            } else {
              setLesson({
                id: node.id,
                title: node.title,
                content: node.content || "# No content available",
                course_id: node.course_id || "",
                parent_context: node.data?.parent_context as string || "",
                content_status: node.content_status,
              })
            }
          } catch (genError) {
            console.error("Error generating content:", genError)
            // Still show the node, even if generation failed
            setLesson({
              id: node.id,
              title: node.title,
              content: node.content || "# Content generation failed\n\nPlease try again later or regenerate.",
              course_id: node.course_id || "",
              parent_context: node.data?.parent_context as string || "",
              content_status: "pending",
            })
          }
          setGenerating(false)
        } else {
          setLesson({
            id: node.id,
            title: node.title,
            content: node.content,
            course_id: node.course_id || "",
            parent_context: node.data?.parent_context as string || "",
            content_status: node.content_status,
          })
        }
      } catch (error) {
        console.error("Error fetching lesson:", error)
        // Fallback to mock data if API fails
        setLesson({
          id: lessonId,
          title: "Lesson Content",
          course_id: "",
          parent_context: "",
          content: "# Unable to load content\n\nPlease try again later.",
          content_status: "pending",
        })
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

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <p className="text-slate-400">{generating ? "Generating theory content..." : "Loading..."}</p>
        </div>
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