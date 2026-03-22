"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Editor, { OnMount } from "@monaco-editor/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, Code, Play, ChevronRight, ChevronLeft, CheckCircle, XCircle, Loader2, RefreshCw, BookOpen, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmartConsole } from "@/components/smart-console"
import { aiApi, nodesApi, coursesApi, CourseNode } from "@/lib/api"

interface PracticeData {
  id: string
  title: string
  task: string
  solution: string
  tests: Array<{ input: string; expected_output: string }>
  course_id: string
  parent_context?: string
  content_status: string
}

interface TheoryData {
  id: string
  title: string
  content: string | null
}

interface NavigationInfo {
  prevNode: CourseNode | null
  nextNode: CourseNode | null
  currentIndex: number
  totalLessons: number
}

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params.id as string
  const [practice, setPractice] = useState<PracticeData | null>(null)
  const [relatedTheory, setRelatedTheory] = useState<TheoryData | null>(null)
  const [showTheory, setShowTheory] = useState(false)
  const [navigation, setNavigation] = useState<NavigationInfo>({ prevNode: null, nextNode: null, currentIndex: 0, totalLessons: 0 })
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; output?: string } | null>(null)
  const [showTask, setShowTask] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const editorRef = useRef<any>(null)

  const calculateNavigation = useCallback((courseData: { nodes: CourseNode[] }, currentId: string) => {
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

  const goToPrev = () => {
    if (navigation.prevNode) {
      const type = navigation.prevNode.type === "theory" ? "/theory" : "/practice"
      router.push(`/lesson/${navigation.prevNode.id}${type}`)
    }
  }

  const goToNext = () => {
    if (navigation.nextNode) {
      const type = navigation.nextNode.type === "theory" ? "/theory" : "/practice"
      router.push(`/lesson/${navigation.nextNode.id}${type}`)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const response = await aiApi.generateContent(
        { node_id: lessonId, course_id: practice?.course_id || "", title: practice?.title || "", parent_context: practice?.parent_context || "" },
        "practice"
      )
      if (response.success) {
        const data = response.data as { task: string; solution: string; tests: Array<{ input: string; expected_output: string }> }
        setPractice(prev => prev ? {
          ...prev,
          task: data.task || "# No task available",
          solution: data.solution || "",
          tests: data.tests || [],
          content_status: "generated",
        } : null)
        setCode(data.solution || "")
      }
    } catch (error) {
      console.error("Error regenerating practice:", error)
    } finally {
      setRegenerating(false)
    }
  }

  useEffect(() => {
    async function fetchPractice() {
      try {
        const node = await nodesApi.getById(lessonId)
        
        if (node.course_id) {
          try {
            const courseData = await coursesApi.getById(node.course_id)
            calculateNavigation(courseData, lessonId)
          } catch (courseError) {
            console.warn("Could not fetch course for navigation:", courseError)
          }
        }
        
        // Try to fetch related theory
        try {
          const theoryResponse = await fetch(`/api/v1/courses/nodes/${lessonId}/theory`)
          if (theoryResponse.ok) {
            const theoryData = await theoryResponse.json()
            if (theoryData.content) {
              setRelatedTheory({
                id: theoryData.id,
                title: theoryData.title,
                content: theoryData.content,
              })
            }
          }
        } catch (theoryError) {
          console.warn("Could not fetch related theory:", theoryError)
        }
        
        if (node.content_status === "pending" || !node.data?.task) {
          setGenerating(true)
          try {
            const result = await aiApi.generateContent(
              { node_id: lessonId, course_id: node.course_id || "", title: node.title, parent_context: node.data?.parent_context || "" },
              "practice"
            )
            if (result.success) {
              const data = result.data as { task: string; solution: string; tests: Array<{ input: string; expected_output: string }> }
              setPractice({
                id: node.id,
                title: node.title,
                task: data.task || "# No task available",
                solution: data.solution || "",
                tests: data.tests || [],
                course_id: node.course_id || "",
                parent_context: node.data?.parent_context as string || "",
                content_status: "generated",
              })
              setCode(data.solution || "")
            } else {
              setPractice({
                id: node.id,
                title: node.title,
                task: node.data?.task as string || "# No task available",
                solution: node.data?.solution as string || "",
                tests: (node.data?.tests as Array<{ input: string; expected_output: string }>) || [],
                course_id: node.course_id || "",
                parent_context: node.data?.parent_context as string || "",
                content_status: node.content_status,
              })
              setCode((node.data?.solution as string) || "")
            }
          } catch (genError) {
            console.error("Error generating practice:", genError)
            setPractice({
              id: node.id,
              title: node.title,
              task: node.data?.task as string || "# Task generation failed\n\nPlease try again later or regenerate.",
              solution: node.data?.solution as string || "",
              tests: (node.data?.tests as Array<{ input: string; expected_output: string }>) || [],
              course_id: node.course_id || "",
              parent_context: node.data?.parent_context as string || "",
              content_status: "pending",
            })
            setCode((node.data?.solution as string) || "")
          }
          setGenerating(false)
        } else {
          const taskData = node.data?.task as string || ""
          const solutionData = node.data?.solution as string || ""
          const testsData = (node.data?.tests as Array<{ input: string; expected_output: string }>) || []
          
          setPractice({
            id: node.id,
            title: node.title,
            task: taskData,
            solution: solutionData,
            tests: testsData,
            course_id: node.course_id || "",
            parent_context: node.data?.parent_context as string || "",
            content_status: node.content_status,
          })
          setCode(solutionData || "")
        }
      } catch (error) {
        console.error("Error fetching practice:", error)
        setPractice({
          id: lessonId,
          title: "Practice",
          task: "# Unable to load task\n\nPlease try again later.",
          solution: "",
          tests: [],
          course_id: "",
          parent_context: "",
          content_status: "pending",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchPractice()
  }, [lessonId, calculateNavigation])

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const handleRunCode = async () => {
    if (!code.trim() || running) return

    setRunning(true)
    setResult(null)

    try {
      const response = await aiApi.validateCode({
        user_code: code,
        expected_output: practice?.tests?.[0]?.expected_output,
        tests: practice?.tests || [],
        context: practice?.parent_context || "",
      })

      if (response.success) {
        const data = response.data as { is_correct: boolean; output?: string; message?: string }
        setResult({
          success: data.is_correct,
          message: data.message || (data.is_correct ? "Correct!" : "Not quite right"),
          output: data.output,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setRunning(false)
    }
  }

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <p className="text-slate-400">{generating ? "Generating practice content..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  if (!practice) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Practice not found</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-80">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-30">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/course/${practice.course_id}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              <div>
                <h1 className="text-lg font-semibold">{practice.title}</h1>
                <p className="text-sm text-slate-400">Practice • {navigation.currentIndex}/{navigation.totalLessons}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goToPrev} disabled={!navigation.prevNode} className="text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleRunCode}
              disabled={running || !code.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {running ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Code
            </Button>
            <Button variant="ghost" size="sm" onClick={goToNext} disabled={!navigation.nextNode} className="text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={regenerating} className="text-slate-400">
              <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Theory Preview Section */}
      {relatedTheory && (
        <div className="border-b border-slate-800 bg-slate-900/30">
          <button
            onClick={() => setShowTheory(!showTheory)}
            className="w-full container mx-auto px-6 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">📖 {relatedTheory.title}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTheory ? "rotate-180" : ""}`} />
          </button>
          
          {showTheory && (
            <div className="container mx-auto px-6 pb-4">
              <div className="prose prose-invert prose-sm max-w-none max-h-64 overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-white">{children}</h2>,
                    p: ({ children }) => <p className="text-slate-300 mb-2 text-sm leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-slate-300 space-y-0.5 text-sm">{children}</ul>,
                    code: ({ children }) => <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 text-xs">{children}</code>,
                    pre: ({ children }) => <pre className="bg-slate-900 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                  }}
                >
                  {relatedTheory.content || "_Теория загружается..._"}
                </ReactMarkdown>
              </div>
              <Link href={`/lesson/${relatedTheory.id}/theory`}>
                <Button variant="ghost" size="sm" className="mt-2 text-slate-400 hover:text-white">
                  Открыть теорию полностью
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Task Panel */}
      {showTask && (
        <div className="border-b border-slate-800 bg-slate-900/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Task</h2>
              <button
                onClick={() => setShowTask(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Hide
              </button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-slate-300 whitespace-pre-wrap">{practice.task}</div>
            </div>
          </div>
        </div>
      )}

      {/* Result Banner */}
      {result && (
        <div className={`border-b ${result.success ? "border-emerald-500/50 bg-emerald-900/20" : "border-red-500/50 bg-red-900/20"}`}>
          <div className="container mx-auto px-6 py-3 flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={result.success ? "text-emerald-300" : "text-red-300"}>
              {result.message}
            </span>
            {result.output && (
              <span className="text-slate-400 text-sm ml-2">
                Output: {result.output}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="h-[calc(100vh-200px)] min-h-[400px]">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            padding: { top: 16 },
          }}
        />
      </div>

      {/* Show Task Toggle */}
      {!showTask && (
        <button
          onClick={() => setShowTask(true)}
          className="fixed top-20 right-6 z-20 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Show Task
        </button>
      )}

      {/* Smart Console */}
      <SmartConsole
        mode="run"
        nodeId={lessonId}
        courseId={practice.course_id}
        context={practice.parent_context || ""}
      />
    </div>
  )
}
