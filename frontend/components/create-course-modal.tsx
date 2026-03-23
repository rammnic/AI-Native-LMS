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
  const [language, setLanguage] = useState("ru") // Language setting: ru/en
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "generating" | "success">("input")
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null)

  // Helper function to flatten AI structure to nodes with proper order_index preservation
  const flattenStructure = (
    structure: Array<{ id: string; title: string; type: string; order_index?: number; children?: Array<{ id: string; title: string; type: string; order_index?: number; content: unknown }> }>,
    parentId: string | null = null,
    nodes: Array<{ id: string; title: string; type: "topic" | "theory" | "practice"; parent_id: string | null; order_index: number }> = [],
    idMap: Map<string, string> = new Map(),
    siblingIndex: number = 0
  ): Array<{ id: string; title: string; type: "topic" | "theory" | "practice"; parent_id: string | null; order_index: number }> => {
    structure.forEach((item, idx) => {
      // Generate new UUID for each node but preserve AI's order_index if provided
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      
      // Preserve order from AI structure, fallback to sibling index
      const orderIndex = item.order_index ?? idx;
      
      // Include the generated id so backend uses it
      nodes.push({
        id: newId,
        title: item.title,
        type: item.type as "topic" | "theory" | "practice",
        parent_id: parentId,
        order_index: orderIndex,
      });

      if (item.children && item.children.length > 0) {
        flattenStructure(item.children, newId, nodes, idMap, 0);
      }
    });
    return nodes;
  };

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
        const data = result.data as { 
          course_title?: string; 
          course_description?: string;
          structure?: Array<{ id: string; title: string; type: string; children?: Array<{ id: string; title: string; type: string; content: unknown }> }>;
        }
        
        console.log("AI result:", result);
        console.log("AI data:", data);
        console.log("Structure:", data?.structure);
        
        // Create course in DB with language setting
        const course = await coursesApi.create(
          data.course_title || "Untitled Course",
          data.course_description || "",
          { difficulty, depth_limit: parseInt(depthLimit), language }
        )
        console.log("Course created:", course);

        // If AI returned structure, save nodes to the course
        if (data.structure && data.structure.length > 0) {
          const nodesToCreate = flattenStructure(data.structure);
          console.log("Nodes to create:", nodesToCreate);
          if (nodesToCreate.length > 0) {
            const nodesResult = await coursesApi.createNodes(course.id, nodesToCreate);
            console.log("Nodes created:", nodesResult);
          }
        }

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

              <div className="grid grid-cols-3 gap-4">
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
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
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