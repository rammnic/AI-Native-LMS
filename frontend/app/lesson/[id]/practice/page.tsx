"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import Editor, { OnMount } from "@monaco-editor/react"
import { ArrowLeft, Code, Play, ChevronRight, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmartConsole } from "@/components/smart-console"
import { aiApi } from "@/lib/api"

interface PracticeData {
  id: string
  title: string
  task: string
  solution: string
  tests: Array<{ input: string; expected_output: string }>
  course_id: string
  parent_context?: string
}

export default function PracticePage() {
  const params = useParams()
  const lessonId = params.id as string
  const [practice, setPractice] = useState<PracticeData | null>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; output?: string } | null>(null)
  const [showTask, setShowTask] = useState(true)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    async function fetchPractice() {
      try {
        // Mock data for demo - in real app would fetch from API
        const mockPractice: PracticeData = {
          id: lessonId,
          title: "Hello World",
          course_id: "demo-course-1",
          parent_context: "User is learning Python basics - just read about print()",
          task: `## Task: Hello World

Write a Python program that prints "Hello, World!" to the console.

### Requirements:
- Use the \`print()\` function
- Output must be exactly: \`Hello, World!\`

### Example:
\`\`\`python
print("Hello, World!")
\`\`\``,
          solution: 'print("Hello, World!")',
          tests: [{ input: "", expected_output: "Hello, World!" }],
        }
        setPractice(mockPractice)
        setCode(mockPractice.solution)
      } catch (error) {
        console.error("Error fetching practice:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPractice()
  }, [lessonId])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
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
                <p className="text-sm text-slate-400">Practice</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            <Link href={`/lesson/${lessonId}/theory`}>
              <Button variant="secondary" size="sm">
                Back to Theory
              </Button>
            </Link>
          </div>
        </div>
      </header>

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