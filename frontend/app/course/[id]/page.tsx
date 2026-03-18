"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, BookOpen, FileText, Code, Sparkles, ArrowLeft } from "lucide-react";
import { coursesApi, aiApi, CourseNode } from "@/lib/api";

export default function CoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<{ id: string; title: string; description: string; nodes: CourseNode[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const fetchCourse = async () => {
    try {
      const data = await coursesApi.getById(courseId);
      setCourse(data);
      if (data.nodes.length > 0) {
        setExpandedNodes(new Set(data.nodes.map((n: CourseNode) => n.id)));
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourse();
  }, [courseId]);

  const handleGenerateStructure = async () => {
    setGenerating(true);
    try {
      // Generate new structure via AI
      const result = await aiApi.generateStructure({
        user_prompt: `Expand course: ${course?.title}`,
        difficulty: "intermediate",
        depth_limit: 3,
        user_id: "demo-user-1",
      });

      if (result.success) {
        const data = result.data as { 
          structure?: Array<{ id: string; title: string; type: string; children?: Array<{ id: string; title: string; type: string; content: unknown }> }>;
        };
        
        if (data.structure && data.structure.length > 0) {
          // Flatten structure and save nodes - include generated UUIDs
          const flattenStructure = (
            structure: Array<{ id: string; title: string; type: string; children?: Array<{ id: string; title: string; type: string; content: unknown }> }>,
            parentId: string | null = null,
            nodes: Array<{ id: string; title: string; type: "topic" | "theory" | "practice"; parent_id: string | null }> = []
          ): Array<{ id: string; title: string; type: "topic" | "theory" | "practice"; parent_id: string | null }> => {
            structure.forEach((item) => {
              const newId = crypto.randomUUID();
              nodes.push({
                id: newId,
                title: item.title,
                type: item.type as "topic" | "theory" | "practice",
                parent_id: parentId,
              });
              if (item.children && item.children.length > 0) {
                flattenStructure(item.children, newId, nodes);
              }
            });
            return nodes;
          };

          const nodesToCreate = flattenStructure(data.structure);
          if (nodesToCreate.length > 0) {
            await coursesApi.createNodes(courseId, nodesToCreate);
          }
        }
        
        // Refresh course data
        await fetchCourse();
      }
    } catch (error) {
      console.error("Error generating structure:", error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "topic": return <BookOpen className="w-4 h-4 text-violet-400" />;
      case "theory": return <FileText className="w-4 h-4 text-cyan-400" />;
      case "practice": return <Code className="w-4 h-4 text-emerald-400" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Course not found</div>;
  }

  const renderNode = (node: CourseNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} style={{ marginLeft: depth * 20 }}>
        <div className={`flex items-center gap-2 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer ${node.type === "topic" ? "font-medium" : ""}`} onClick={() => hasChildren && toggleNode(node.id)}>
          {hasChildren && <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />}
          {!hasChildren && <div className="w-4" />}
          {getNodeIcon(node.type)}
          <span className="flex-1">{node.title}</span>
          {node.type === "theory" && <Link href={`/lesson/${node.id}/theory`} className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">Theory</Link>}
          {node.type === "practice" && <Link href={`/lesson/${node.id}/practice`} className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">Practice</Link>}
        </div>
        {hasChildren && isExpanded && <div>{node.children!.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    );
  };

  const buildTree = (nodes: CourseNode[]): CourseNode[] => {
    const nodeMap = new Map<string, CourseNode>();
    const roots: CourseNode[] = [];
    nodes.forEach((node) => nodeMap.set(node.id, { ...node, children: [] }));
    nodes.forEach((node) => {
      const currentNode = nodeMap.get(node.id)!;
      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id);
        if (parent) { parent.children = parent.children || []; parent.children.push(currentNode); }
      } else { roots.push(currentNode); }
    });
    return roots;
  };

  const treeNodes = buildTree(course.nodes);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-400" /></Link>
            <div><h1 className="text-lg font-semibold">{course.title}</h1><p className="text-sm text-slate-400">{course.description}</p></div>
          </div>
          <button 
            onClick={handleGenerateStructure}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium disabled:opacity-50"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate More
          </button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Course Structure</h2>
          {treeNodes.length > 0 ? <div className="space-y-1">{treeNodes.map((node) => renderNode(node))}</div> : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No content yet</p>
              <button 
                onClick={handleGenerateStructure}
                disabled={generating}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-xl font-medium disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Generating...
                  </>
                ) : (
                  "Generate Course Structure"
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}