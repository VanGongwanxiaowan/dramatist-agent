/**
 * 故事分析页面
 * 提供故事五元素分析、系列分析、情节点工作流等功能
 */

import { useState, useRef, useEffect } from "react";
import { FileText, Play, Square, Loader2, Download, Upload, BookOpen, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import Header from "@/components/Header";
import { useStoryAnalysisStream, usePlotPointsWorkflow } from "@/hooks/useStreamChat";
import { jubenApi } from "@/lib/api";

interface AnalysisResult {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  metadata?: any;
}

const analysisTypes = [
  { value: "five_elements", label: "故事五元素分析", icon: Brain },
  { value: "series_analysis", label: "已播剧集分析", icon: BookOpen },
  { value: "plot_points", label: "情节点分析", icon: Target },
];

const StoryAnalysis = () => {
  const [inputContent, setInputContent] = useState("");
  const [selectedType, setSelectedType] = useState("five_elements");
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 故事分析流式Hook
  const storyAnalysis = useStoryAnalysisStream({
    onStart: () => {
      setIsAnalyzing(true);
      console.log('开始故事分析');
    },
    onUpdate: (content, metadata) => {
      // 更新当前分析结果
      setResults(prev => 
        prev.map((result, index) => 
          index === prev.length - 1 
            ? { ...result, content, metadata }
            : result
        )
      );
    },
    onComplete: (finalContent, metadata) => {
      console.log('故事分析完成', { finalContent, metadata });
      setIsAnalyzing(false);
      // 滚动到底部
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      console.error('故事分析错误:', error);
      setIsAnalyzing(false);
    },
  });

  // 情节点工作流Hook
  const plotPointsWorkflow = usePlotPointsWorkflow({
    onStart: () => {
      setIsAnalyzing(true);
      console.log('开始情节点工作流');
    },
    onUpdate: (content, metadata) => {
      setResults(prev => 
        prev.map((result, index) => 
          index === prev.length - 1 
            ? { ...result, content, metadata }
            : result
        )
      );
    },
    onComplete: (finalContent, metadata) => {
      console.log('情节点工作流完成', { finalContent, metadata });
      setIsAnalyzing(false);
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      console.error('情节点工作流错误:', error);
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async () => {
    if (!inputContent.trim() || isAnalyzing) return;

    // 创建新的分析结果
    const newResult: AnalysisResult = {
      id: Date.now().toString(),
      type: selectedType,
      content: "",
      timestamp: new Date(),
    };

    setResults(prev => [...prev, newResult]);

    // 滚动到底部
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);

    try {
      if (selectedType === "plot_points") {
        // 使用情节点工作流
        await plotPointsWorkflow.executeWorkflow({
          message: inputContent,
          agent_type: "plot-points-workflow",
          session_id: jubenApi.getSessionId(),
          context: {
            analysis_type: selectedType,
            input_content: inputContent,
          },
        });
      } else {
        // 使用故事分析
        await storyAnalysis.analyzeStory(
          inputContent,
          selectedType as 'five_elements' | 'series_analysis' | 'plot_points',
          {
            session_id: jubenApi.getSessionId(),
            input_content: inputContent,
          }
        );
      }
    } catch (error) {
      console.error('分析失败:', error);
    }
  };

  const handleStopAnalysis = () => {
    if (storyAnalysis.isStreaming) {
      storyAnalysis.stopAnalysis();
    }
    if (plotPointsWorkflow.isStreaming) {
      plotPointsWorkflow.stopWorkflow();
    }
    setIsAnalyzing(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      results: results.map(result => ({
        type: result.type,
        content: result.content,
        timestamp: result.timestamp,
        metadata: result.metadata,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_analysis_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAnalysisTypeLabel = (type: string) => {
    return analysisTypes.find(t => t.value === type)?.label || type;
  };

  const getAnalysisTypeIcon = (type: string) => {
    const IconComponent = analysisTypes.find(t => t.value === type)?.icon || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧输入区域 */}
        <div className="w-1/2 border-r border-border bg-card overflow-hidden">
          <div className="h-full flex flex-col p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">故事内容输入</h2>
              <div className="space-y-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分析类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="请输入要分析的故事内容、剧本大纲、角色设定等..."
                  className="min-h-[300px] resize-none"
                  disabled={isAnalyzing}
                />

                <div className="flex gap-2">
                  {isAnalyzing ? (
                    <Button 
                      onClick={handleStopAnalysis} 
                      variant="destructive"
                      className="shadow-glow"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      停止分析
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleAnalyze} 
                      className="gradient-primary text-white shadow-glow"
                      disabled={!inputContent.trim()}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      开始分析
                    </Button>
                  )}
                  
                  <Button 
                    onClick={clearResults} 
                    variant="outline"
                    disabled={results.length === 0 || isAnalyzing}
                  >
                    清空结果
                  </Button>
                </div>
              </div>
            </div>

            {/* 分析状态 */}
            {isAnalyzing && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">正在分析中...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 右侧结果区域 */}
        <div className="w-1/2 bg-card overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="border-b border-border p-4 bg-card/50 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">分析结果</h2>
                <Button 
                  onClick={exportResults} 
                  variant="outline" 
                  size="sm"
                  disabled={results.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出结果
                </Button>
              </div>
            </div>

            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {results.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无分析结果</p>
                    <p className="text-sm">请在左侧输入故事内容并选择分析类型</p>
                  </div>
                ) : (
                  results.map((result) => (
                    <Card key={result.id} className="animate-fade-in">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          {getAnalysisTypeIcon(result.type)}
                          {getAnalysisTypeLabel(result.type)}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {result.content ? (
                            <ReactMarkdown>{result.content}</ReactMarkdown>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>分析中...</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryAnalysis;
