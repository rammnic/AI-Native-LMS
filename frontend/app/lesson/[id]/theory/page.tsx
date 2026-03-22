"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, BookOpen, RefreshCw, ChevronRight, Loader2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmartConsole } from "@/components/smart-console"
import { aiApi, nodesApi, coursesApi, CourseNode } from "@/lib/api"

interface LessonData {
  id: string
  title: string
  content: string
  course_id: string
  parent_context?: string
  content_status: string
}

interface CourseData {
  id: string
  title: string
  nodes: CourseNode[]
}

interface NavigationInfo {
  prevNode: CourseNode | null
  nextNode: CourseNode | null
  currentIndex: number
  totalLessons: number
}

export default function TheoryPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [course, setCourse] = useState<CourseData | null>(null)
  const [navigation, setNavigation] = useState<NavigationInfo>({ prevNode: null, nextNode: null, currentIndex: 0, totalLessons: 0 })
  const [topicLessons, setTopicLessons] = useState<CourseNode[]>([])
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Calculate navigation between lessons - using f_order for simple and correct numbering
  const calculateNavigation = useCallback((courseData: CourseData, currentId: string) => {
    // Filter only lessons (theory/practice) and sort by f_order
    const lessonNodes = courseData.nodes
      .filter(n => n.type === "theory" || n.type === "practice")
      .sort((a, b) => a.f_order - b.f_order)
    
    const currentIndex = lessonNodes.findIndex(n => n.id === currentId)
    
    setNavigation({
      prevNode: currentIndex > 0 ? lessonNodes[currentIndex - 1] : null,
      nextNode: currentIndex < lessonNodes.length - 1 ? lessonNodes[currentIndex + 1] : null,
      currentIndex: currentIndex + 1,
      totalLessons: lessonNodes.length,
    })
  }, [])

  // Get lessons in the same topic (siblings)
  const getTopicLessons = useCallback((courseData: CourseData, currentNode: CourseNode | null) => {
    if (!currentNode) return []
    
    // Get all nodes for the same parent
    const siblings = courseData.nodes.filter(n => {
      if (n.type === "topic") return false
      return n.parent_id === currentNode.parent_id && n.id !== currentNode.id
    })
    
    // Sort siblings by order
    siblings.sort((a, b) => a.f_order - b.f_order)
    
    // Add current node to show in the list
    const currentWithSiblings = [currentNode, ...siblings].sort((a, b) => a.f_order - b.f_order)
    
    return currentWithSiblings
  }, [])

  // Navigate to previous lesson
  const goToPrev = () => {
    if (navigation.prevNode) {
      const type = navigation.prevNode.type === "theory" ? "/theory" : "/practice"
      router.push(`/lesson/${navigation.prevNode.id}${type}`)
    }
  }

  // Navigate to next lesson
  const goToNext = () => {
    if (navigation.nextNode) {
      const type = navigation.nextNode.type === "theory" ? "/theory" : "/practice"
      router.push(`/lesson/${navigation.nextNode.id}${type}`)
    }
  }

  useEffect(() => {
    async function fetchLesson() {
      try {
        // Fetch node from API
        const node = await nodesApi.getById(lessonId)
        
        // Fetch course to get all nodes for navigation
        if (node.course_id) {
          try {
            const courseData = await coursesApi.getById(node.course_id)
            setCourse(courseData)
            calculateNavigation(courseData, lessonId)
            
            // Get topic lessons (siblings)
            const currentNode = courseData.nodes.find(n => n.id === lessonId)
            if (currentNode) {
              const siblings = getTopicLessons(courseData, currentNode)
              setTopicLessons(siblings)
            }
          } catch (courseError) {
            console.warn("Could not fetch course for navigation:", courseError)
          }
        }
        
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
  }, [lessonId, calculateNavigation, getTopicLessons])

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
                <p className="text-sm text-slate-400">Theory • {navigation.currentIndex}/{navigation.totalLessons}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleRegenerate} disabled={regenerating}>
              <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation between lessons */}
      <div className="container mx-auto px-6 py-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={goToPrev}
            disabled={!navigation.prevNode}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {navigation.prevNode?.title || "Previous"}
          </Button>
          
          <span className="text-sm text-slate-500">
            {navigation.currentIndex} / {navigation.totalLessons}
          </span>
          
          <Button 
            variant="ghost" 
            onClick={goToNext}
            disabled={!navigation.nextNode}
            className="text-slate-400 hover:text-white"
          >
            {navigation.nextNode?.title || "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Topic Lessons Section */}
      {topicLessons.length > 1 && (
        <div className="container mx-auto px-6 py-4 max-w-3xl">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Уроки темы
            </h3>
            <div className="flex flex-wrap gap-2">
              {topicLessons.map(sibling => {
                const isCurrent = sibling.id === lessonId
                return (
                  <Link
                    key={sibling.id}
                    href={`/lesson/${sibling.id}/${sibling.type}`}
                    className={`
                      px-3 py-1.5 rounded-full text-sm transition-colors
                      ${isCurrent 
                        ? "bg-violet-600 text-white" 
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                      }
                    `}
                  >
                    {sibling.type === "theory" ? "📖" : "💻"} {sibling.title}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-6 py-4 max-w-3xl">
        <article className="prose prose-invert prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
