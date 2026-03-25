"use client"

import { useState } from "react"
import { Sparkles, Loader2, CheckCircle, PenTool } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { aiApi, coursesApi } from "@/lib/api"
import { PromptDetail } from "@/lib/api"
import { PromptSelector } from "./prompt-selector"

interface CreateCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCourseCreated?: (courseId: string) => void
}

type TabType = "custom" | "templates";

export function CreateCourseModal({ open, onOpenChange, onCourseCreated }: CreateCourseModalProps) {
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState("intermediate")
  const [depthLimit, setDepthLimit] = useState("3")
  const [language, setLanguage] = useState("ru")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "generating" | "success">("input")
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("custom")

  const flattenStructure = (
    structure: Array<{ id: string; title: string; type: string; order_index?: number; children?: Array<{ id: string; title: string; type: string; order_index?: number; content: unknown }> }>,
    parentId: string | null = null,
    nodes: Array<{ id: string; title: string; type: "topic" | "theory" | "practice"; parent_id: string | null; order_index: number }> = [],
    idMap: Map<string, string> = new Map(),
    siblingIndex: number = 0
  ): Array<{ id: string; title: string; type: "topic" | "theory" | "practice"; parent_id: string | null; order_index: number }> => {
    structure.forEach((item, idx) => {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      const orderIndex = item.order_index ?? idx;
      
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

  const handlePromptSelected = (promptDetail: PromptDetail) => {
    setPrompt(promptDetail.prompt_text);
    setDifficulty(promptDetail.parameters.difficulty);
    setDepthLimit(String(promptDetail.parameters.depth_limit));
    setActiveTab("custom");
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setStep("generating")

    try {
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
        
        const course = await coursesApi.create(
          data.course_title || "Без названия",
          data.course_description || "",
          { difficulty, depth_limit: parseInt(depthLimit), language }
        )

        if (data.structure && data.structure.length > 0) {
          const nodesToCreate = flattenStructure(data.structure);
          if (nodesToCreate.length > 0) {
            await coursesApi.createNodes(course.id, nodesToCreate);
          }
        }

        setGeneratedCourseId(course.id)
        setStep("success")
        onCourseCreated?.(course.id)
      }
    } catch (error) {
      console.error("Ошибка создания курса:", error)
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
    setActiveTab("custom")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Создать новый курс
              </DialogTitle>
              <DialogDescription>
                Опишите, что вы хотите изучить, или выберите готовый шаблон.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 py-4 border-b border-slate-700">
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "custom"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <PenTool className="w-4 h-4" />
                Свой
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "templates"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Шаблоны
              </button>
            </div>

            {activeTab === "custom" && (
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Что вы хотите изучить?
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Например: Я хочу изучить Golang за 2 недели, я знаю Python..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Сложность
                    </label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Начинающий</SelectItem>
                        <SelectItem value="intermediate">Средний</SelectItem>
                        <SelectItem value="advanced">Продвинутый</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Глубина
                    </label>
                    <Select value={depthLimit} onValueChange={setDepthLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2 уровня</SelectItem>
                        <SelectItem value="3">3 уровня</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Язык
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
            )}

            {activeTab === "templates" && (
              <div className="py-4">
                <PromptSelector
                  onSelect={handlePromptSelected}
                  onCancel={() => setActiveTab("custom")}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} disabled={!prompt.trim() || loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Создать курс
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
            <h3 className="text-lg font-semibold text-white mb-2">Генерация структуры курса</h3>
            <p className="text-slate-400">
              ИИ анализирует ваш запрос и создаёт персонализированный план обучения...
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Курс создан!</h3>
            <p className="text-slate-400 mb-6">
              Ваш персонализированный курс был создан. Начните обучение прямо сейчас!
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleClose}>
                Закрыть
              </Button>
              {generatedCourseId && (
                <Button onClick={() => {
                  handleClose()
                  window.location.href = `/course/${generatedCourseId}`
                }}>
                  Перейти к курсу
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}