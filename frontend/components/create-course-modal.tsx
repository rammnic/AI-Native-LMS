"use client"

import { useState } from "react"
import { Sparkles, Loader2, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { aiApi, coursesApi } from "@/lib/api"

interface CreateCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCourseCreated?: (courseId: string) => void
}

export function CreateCourseModal({ open, onOpenChange, onCourseCreated }: CreateCourseModalProps) {
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState("intermediate")
  const [depthLimit, setDepthLimit] = useState("3")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "generating" | "success">("input")
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setStep("generating")

    try {
      // Generate course structure via AI
      const result = await aiApi.generateStructure({
        user_prompt: prompt,
        difficulty,
        depth_limit: parseInt(depthLimit),
        user_id: "demo-user-1",
      })

      if (result.success) {
        const data = result.data as { course_title: string; course_description: string }
        
        // Create course in DB
        const course = await coursesApi.create(
          data.course_title,
          data.course_description,
          { difficulty, depth_limit: parseInt(depthLimit) }
        )

        setGeneratedCourseId(course.id)
        setStep("success")
        onCourseCreated?.(course.id)
      }
    } catch (error) {
      console.error("Error creating course:", error)
      setStep("input")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPrompt("")
    setDifficulty("intermediate")
    setDepthLimit("3")
    setStep("input")
    setGeneratedCourseId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Create New Course
              </DialogTitle>
              <DialogDescription>
                Describe what you want to learn. AI will generate a personalized course structure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  What do you want to learn?
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., I want to learn Golang in 2 weeks, I know Python..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Difficulty
                  </label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Depth Level
                  </label>
                  <Select value={depthLimit} onValueChange={setDepthLimit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 levels</SelectItem>
                      <SelectItem value="3">3 levels</SelectItem>
                      <SelectItem value="4">4 levels</SelectItem>
                      <SelectItem value="5">5 levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!prompt.trim() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Course
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "generating" && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-violet-600/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Generating Course Structure</h3>
            <p className="text-slate-400">
              AI is analyzing your request and building a personalized learning path...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Course Created!</h3>
            <p className="text-slate-400 mb-6">
              Your personalized course has been generated. Start learning now!
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              {generatedCourseId && (
                <Button onClick={() => {
                  handleClose()
                  window.location.href = `/course/${generatedCourseId}`
                }}>
                  Go to Course
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}