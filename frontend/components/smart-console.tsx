"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Play, MessageSquare, Terminal, Loader2, Bot, User, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { aiApi } from "@/lib/api"

type Message = {
  id: string
  type: "user" | "ai" | "system" | "log"
  content: string
  timestamp: Date
}

type ConsoleMode = "chat" | "run"

interface SmartConsoleProps {
  mode?: ConsoleMode
  defaultMode?: ConsoleMode
  onModeChange?: (mode: ConsoleMode) => void
  nodeId?: string
  courseId?: string
  context?: string
  lessonContent?: string
  onCodeRun?: (code: string) => void
}

export function SmartConsole({
  mode: controlledMode,
  defaultMode = "chat",
  onModeChange,
  nodeId,
  courseId,
  context = "",
  lessonContent = "",
  onCodeRun,
}: SmartConsoleProps) {
  const [mode, setMode] = useState<ConsoleMode>(controlledMode || defaultMode)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "Smart Console ready. Switch between Chat and Run modes to interact with AI.",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeMode = controlledMode || mode

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = (type: Message["type"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type, content, timestamp: new Date() },
    ])
  }

  const handleModeSwitch = (newMode: ConsoleMode) => {
    if (!controlledMode) {
      setMode(newMode)
    }
    onModeChange?.(newMode)
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput("")
    addMessage("user", userInput)

    if (activeMode === "run") {
      // Run mode - validate code
      setIsLoading(true)
      addMessage("system", "Running code validation...")
      
      try {
        const result = await aiApi.validateCode({
          user_code: userInput,
          context,
          node_id: nodeId,
        })
        
        if (result.success) {
          const data = result.data as { is_correct: boolean; output?: string; message?: string }
          if (data.is_correct) {
            addMessage("system", `✅ ${data.message || "Code is correct!"}`)
          } else {
            addMessage("system", `❌ ${data.message || "Code has issues"}`)
          }
          if (data.output) {
            addMessage("log", `Output: ${data.output}`)
          }
        }
      } catch (error) {
        addMessage("system", `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Chat mode - ask AI with lesson content context
      setIsLoading(true)
      
      try {
        const result = await aiApi.chat({
          question: userInput,
          context,
          node_id: nodeId,
          lesson_content: lessonContent,
        })
        
        if (result.success) {
          const data = result.data as { answer: string }
          if (data.answer && data.answer.trim()) {
            addMessage("ai", data.answer)
          } else {
            addMessage("system", "AI returned an empty response. Please try again.")
          }
        }
      } catch (error) {
        addMessage("system", `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getMessageIcon = (type: Message["type"]) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />
      case "ai":
        return <Bot className="w-4 h-4" />
      case "system":
        return <MessageSquare className="w-4 h-4" />
      case "log":
        return <Terminal className="w-4 h-4" />
    }
  }

  const getMessageColor = (type: Message["type"]) => {
    switch (type) {
      case "user":
        return "bg-violet-600/20 border-violet-500/30"
      case "ai":
        return "bg-cyan-600/20 border-cyan-500/30"
      case "system":
        return "bg-slate-800 border-slate-700"
      case "log":
        return "bg-emerald-900/30 border-emerald-500/30"
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800">
        <button
          onClick={() => handleModeSwitch("chat")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeMode === "chat"
              ? "bg-violet-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => handleModeSwitch("run")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeMode === "run"
              ? "bg-emerald-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Run
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Messages */}
      {isExpanded && (
        <div className="h-64 overflow-y-auto px-4 py-3 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 p-3 rounded-lg border ${getMessageColor(msg.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">{getMessageIcon(msg.type)}</div>
              <div className="flex-1 text-sm text-white whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeMode === "run" ? "Write your code here..." : "Ask AI a question..."}
              className="min-h-[60px] max-h-[120px]"
              disabled={isLoading}
            />
            <Button onClick={handleSubmit} disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : activeMode === "run" ? (
                <Play className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  )
}