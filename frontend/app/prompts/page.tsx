"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Zap, Users } from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { promptsApi, PromptInfo, PromptDetail, CareerPath, PromptCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

// Custom node component for career paths
function CareerNode({ data }: { data: { label: string; level: string } }) {
  const levelColors = {
    beginner: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
    intermediate: "bg-amber-500/20 border-amber-500/50 text-amber-300",
    advanced: "bg-violet-500/20 border-violet-500/50 text-violet-300",
  };

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${levelColors[data.level as keyof typeof levelColors]}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <p className="text-sm font-medium text-center">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

const nodeTypes = {
  career: CareerNode,
};

export default function PromptsPage() {
  const { isAuthenticated } = useAuth();
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptInfo | null>(null);
  const [promptDetail, setPromptDetail] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [promptsData, categoriesData] = await Promise.all([
          promptsApi.getAll(),
          promptsApi.getCategories(),
        ]);
        console.log("📚 Prompts loaded:", promptsData);
        console.log("🏷️ Categories loaded:", categoriesData);
        setPrompts(promptsData);
        setCategories(categoriesData.categories);
      } catch (error) {
        console.error("Ошибка загрузки промптов:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    // Build career map - IDs should match REAL prompt IDs from API for clickability
    // Map: display ID -> actual prompt ID
    const promptIdMap: Record<string, string> = {
      "zero-to-it": "zero-to-it/computer-basics",
      "support/support-beginner": "support/support-beginner",
      "support/support-l1-to-l2": "support/support-l1-to-l2",
      "sysadmin/sysadmin-beginner": "sysadmin/sysadmin-beginner",
      "sysadmin/sysadmin-junior-middle": "sysadmin/sysadmin-junior-middle",
      "devops/devops-from-it": "devops/devops-from-it",
      "devops/devops-course-prompt": "devops-course-prompt",
      "devops/devops-senior-sre": "devops/devops-senior-sre",
      "sre/sre-basics": "sre/sre-basics",
      "sre/sre-advanced": "sre/sre-advanced",
      "cloud/cloud-engineer": "cloud/cloud-engineer",
      "platform/platform-engineer": "platform/platform-engineer",
    };

    const careerData: CareerPath[] = [
      { id: "zero-to-it", title: "Zero to IT", level: "beginner", children: ["support/support-beginner", "sysadmin/sysadmin-beginner"] },
      { id: "support/support-beginner", title: "L1 Support", level: "beginner", children: ["support/support-l1-to-l2"] },
      { id: "support/support-l1-to-l2", title: "L2 Support", level: "intermediate", children: ["devops/devops-from-it"] },
      { id: "sysadmin/sysadmin-beginner", title: "Junior SysAdmin", level: "beginner", children: ["sysadmin/sysadmin-junior-middle"] },
      { id: "sysadmin/sysadmin-junior-middle", title: "Middle SysAdmin", level: "intermediate", children: ["devops/devops-course-prompt", "sre/sre-basics"] },
      { id: "devops/devops-from-it", title: "DevOps from IT", level: "beginner", children: ["devops/devops-course-prompt"] },
      { id: "devops/devops-course-prompt", title: "DevOps Engineer", level: "intermediate", children: ["devops/devops-senior-sre", "cloud/cloud-engineer", "sre/sre-basics"] },
      { id: "devops/devops-senior-sre", title: "Senior DevOps/SRE", level: "advanced", children: ["sre/sre-advanced", "platform/platform-engineer"] },
      { id: "sre/sre-basics", title: "SRE Basics", level: "intermediate", children: ["sre/sre-advanced"] },
      { id: "sre/sre-advanced", title: "Senior SRE", level: "advanced", children: ["platform/platform-engineer"] },
      { id: "cloud/cloud-engineer", title: "Cloud Engineer", level: "intermediate", children: ["devops/devops-senior-sre", "platform/platform-engineer"] },
      { id: "platform/platform-engineer", title: "Platform Engineer", level: "advanced", children: [] },
    ];

    // Position nodes in a proper tree layout
    const positions: Record<string, { x: number; y: number }> = {
      "zero-to-it": { x: 400, y: 0 },
      "support/support-beginner": { x: 150, y: 150 },
      "sysadmin/sysadmin-beginner": { x: 650, y: 150 },
      "support/support-l1-to-l2": { x: 150, y: 300 },
      "sysadmin/sysadmin-junior-middle": { x: 650, y: 300 },
      "devops/devops-from-it": { x: 50, y: 450 },
      "devops/devops-course-prompt": { x: 300, y: 450 },
      "sre/sre-basics": { x: 550, y: 450 },
      "devops/devops-senior-sre": { x: 200, y: 600 },
      "cloud/cloud-engineer": { x: 450, y: 600 },
      "sre/sre-advanced": { x: 200, y: 750 },
      "platform/platform-engineer": { x: 325, y: 750 },
    };

    const newNodes: Node[] = careerData.map((path) => ({
      id: path.id,
      type: "career",
      position: positions[path.id] || { x: 0, y: 0 },
      data: {
        label: path.title,
        level: path.level,
      },
    }));

    const newEdges: Edge[] = [];
    careerData.forEach((path) => {
      path.children.forEach((childId) => {
        newEdges.push({
          id: `${path.id}-${childId}`,
          source: path.id,
          target: childId,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#64748b", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#64748b",
          },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [prompts, setNodes, setEdges]);

  const filteredPrompts = selectedCategory
    ? prompts.filter((p) => p.category === selectedCategory)
    : prompts;

  const handlePromptSelect = async (prompt: PromptInfo) => {
    console.log("🎯 Selected prompt:", prompt);
    setSelectedPrompt(prompt);
    setPromptDetail(null);
    setLoadingDetail(true);
    
    try {
      const detail = await promptsApi.getById(prompt.id);
      console.log("📄 Loaded prompt detail:", detail);
      setPromptDetail(detail);
    } catch (error) {
      console.error("❌ Failed to load prompt detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Debug: log when category changes
  const handleCategoryChange = (categoryId: string | null) => {
    console.log("🏷️ Category changed:", categoryId);
    console.log("📊 Available prompts:", prompts);
    console.log("📊 Filtered count:", categoryId ? prompts.filter(p => p.category === categoryId).length : prompts.length);
    setSelectedCategory(categoryId);
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
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span className="text-xl font-bold">AI-Native LMS</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Панель управления
            </Link>
            <Link href="/login" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium">
              Войти
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-12 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm">Готовые траектории обучения</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Выберите свой{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              карьерный путь
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Выберите из готовых траекторий обучения, разработанных для разных уровней опыта.
            От IT Support до DevOps, SRE и Platform Engineering.
          </p>
        </div>
      </section>

      {/* Career Map */}
      <section className="px-6 pb-16">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Интерактивная карта карьеры</h2>
          <p className="text-slate-400 text-center mb-8">Нажмите на любой узел, чтобы изучить траекторию обучения</p>
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4" style={{ height: "500px" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(event, node) => {
                console.log("🗺️ Node clicked:", node.id);
                console.log("📚 Available prompts:", prompts.map(p => p.id));
                
                // Try to find prompt by exact ID match first
                let prompt = prompts.find((p) => p.id === node.id);
                
                // If not found, try to find by category (for entry points like "zero-to-it")
                if (!prompt) {
                  prompt = prompts.find((p) => {
                    // Match: "zero-to-it" with "zero-to-it/*"
                    if (node.id === "zero-to-it" && p.id.startsWith("zero-to-it/")) {
                      return true;
                    }
                    return false;
                  });
                }
                
                if (prompt) {
                  console.log("✅ Found prompt:", prompt);
                  setSelectedPrompt(prompt);
                } else {
                  console.log("❌ Prompt not found for node:", node.id);
                }
              }}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
            >
              <Background color="#334155" gap={20} />
              <Controls />
            </ReactFlow>
          </div>

          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-400">Начинающий</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-400">Средний</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-violet-500"></div>
              <span className="text-sm text-slate-400">Продвинутый</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prompts Grid */}
      <section className="py-16 px-6 bg-slate-900/50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Все траектории обучения</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Все
            </button>
            {categories.length === 0 ? (
              <span className="text-slate-500 text-sm">Категории не загружены...</span>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))
            )}
          </div>

          {/* Prompts Cards */}
          {filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all cursor-pointer"
                  onClick={() => handlePromptSelect(prompt)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        prompt.level === "beginner"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : prompt.level === "intermediate"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-violet-500/20 text-violet-300"
                      }`}
                    >
                      {prompt.level === "beginner" ? "Начинающий" : prompt.level === "intermediate" ? "Средний" : "Продвинутый"}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-md bg-slate-700 text-slate-300">
                      {prompt.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{prompt.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{prompt.description}</p>
                  <div className="flex items-center gap-2 text-violet-400 text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Подробнее</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-2">Траектории обучения не найдены</p>
              <p className="text-slate-600 text-sm">
                {prompts.length === 0 ? "Проверьте, что backend запущен на порту 8001" : `Категория: ${selectedCategory}`}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Selected Prompt Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        selectedPrompt.level === "beginner"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : selectedPrompt.level === "intermediate"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-violet-500/20 text-violet-300"
                      }`}
                    >
                      {selectedPrompt.level === "beginner" ? "Начинающий" : selectedPrompt.level === "intermediate" ? "Средний" : "Продвинутый"}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-md bg-slate-700 text-slate-300">
                      {selectedPrompt.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold">{selectedPrompt.title}</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedPrompt(null);
                    setPromptDetail(null);
                  }}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
                  <span className="ml-3 text-slate-400">Загрузка...</span>
                </div>
              ) : promptDetail ? (
                <>
                  <p className="text-slate-300 mb-6">{promptDetail.description}</p>
                  <div className="bg-slate-800 rounded-xl p-4 mb-6 max-h-64 overflow-y-auto">
                    <p className="text-slate-400 text-sm mb-3">Промпт для генерации:</p>
                    <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono">
                      {promptDetail.prompt_text}
                    </pre>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 mb-4">
                    <span>Сложность: <span className="text-violet-400">{promptDetail.parameters.difficulty}</span></span>
                    <span>•</span>
                    <span>Глубина: <span className="text-violet-400">{promptDetail.parameters.depth_limit}</span></span>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800 rounded-xl p-4 mb-6">
                  <p className="text-slate-400 text-sm mb-2">Описание:</p>
                  <p className="text-slate-200 text-sm">{selectedPrompt.description}</p>
                </div>
              )}
              {isAuthenticated ? (
                <Link href={`/dashboard?prompt=${selectedPrompt.id}`}>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Начать обучение
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700">
                    <Users className="w-4 h-4 mr-2" />
                    Войдите, чтобы начать
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="container mx-auto text-center text-slate-500">
          <p>AI-Native LMS — Карьерные траектории © 2026</p>
        </div>
      </footer>
    </div>
  );
}