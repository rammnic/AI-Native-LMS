"use client";

import { useState, useEffect } from "react";
import { Sparkles, Search, BookOpen } from "lucide-react";
import { promptsApi, PromptInfo, PromptDetail, PromptCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PromptSelectorProps {
  onSelect: (prompt: PromptDetail) => void;
  onCancel: () => void;
}

export function PromptSelector({ onSelect, onCancel }: PromptSelectorProps) {
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDetail | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [promptsData, categoriesData] = await Promise.all([
          promptsApi.getAll(),
          promptsApi.getCategories(),
        ]);
        setPrompts(promptsData);
        setCategories(categoriesData.categories);
      } catch (error) {
        console.error("Error fetching prompts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePromptClick = async (promptInfo: PromptInfo) => {
    setLoadingPrompt(true);
    try {
      const detail = await promptsApi.getById(promptInfo.id);
      setSelectedPrompt(detail);
    } catch (error) {
      console.error("Error loading prompt details:", error);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleUsePrompt = () => {
    if (selectedPrompt) {
      onSelect(selectedPrompt);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (selectedPrompt) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-1 text-xs rounded-md ${
                  selectedPrompt.level === "beginner"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : selectedPrompt.level === "intermediate"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-violet-500/20 text-violet-300"
                }`}
              >
                {selectedPrompt.level}
              </span>
              <span className="text-sm text-slate-400">{selectedPrompt.category}</span>
            </div>
            <h3 className="text-lg font-semibold">{selectedPrompt.title}</h3>
          </div>
          <button
            onClick={() => setSelectedPrompt(null)}
            className="text-slate-400 hover:text-white"
          >
            ← Back
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <p className="text-slate-300 text-sm mb-3">
            {selectedPrompt.description}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-violet-500/20 text-violet-300">
              Сложность: {selectedPrompt.parameters.difficulty}
            </span>
            <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">
              Глубина: {selectedPrompt.parameters.depth_limit}
            </span>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-slate-500 mb-2">Параметры генерации:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">difficulty:</span>{" "}
              <span className="text-violet-300">{selectedPrompt.parameters.difficulty}</span>
            </div>
            <div>
              <span className="text-slate-400">depth_limit:</span>{" "}
              <span className="text-violet-300">{selectedPrompt.parameters.depth_limit}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setSelectedPrompt(null)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleUsePrompt} className="flex-1 bg-violet-600 hover:bg-violet-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Use This Prompt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold">Select a Template</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === null
              ? "bg-violet-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Prompts List */}
      <div className="space-y-2 max-h-64 overflow-auto">
        {filteredPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => handlePromptClick(prompt)}
            disabled={loadingPrompt}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-violet-500/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded ${
                  prompt.level === "beginner"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : prompt.level === "intermediate"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-violet-500/20 text-violet-300"
                }`}
              >
                {prompt.level}
              </span>
              <span className="text-[10px] text-slate-500">{prompt.category}</span>
            </div>
            <p className="text-sm font-medium text-slate-200">{prompt.title}</p>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{prompt.description}</p>
          </button>
        ))}
        {filteredPrompts.length === 0 && (
          <p className="text-center text-slate-500 py-8">No templates found</p>
        )}
      </div>

      {/* Cancel */}
      <div className="flex justify-end pt-2">
        <Button variant="secondary" onClick={onCancel} size="sm">
          ← Назад к вводу
        </Button>
      </div>
    </div>
  );
}