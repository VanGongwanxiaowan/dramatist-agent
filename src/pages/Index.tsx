import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";

const agents = [
  {
    category: "编排层智能体",
    items: [
      { name: "JubenOrchestrator", desc: "主编排器，负责工作流管理和任务分解" },
      { name: "JubenConcierge", desc: "门面智能体，提供统一的服务入口" },
    ],
  },
  {
    category: "创作层智能体",
    items: [
      { name: "ShortDramaPlannerAgent", desc: "竖屏短剧策划智能体" },
      { name: "ShortDramaCreatorAgent", desc: "短剧创作智能体" },
      { name: "StoryFiveElementsAgent", desc: "故事五元素分析智能体" },
      { name: "CharacterProfileAgent", desc: "角色设定智能体" },
      { name: "CharacterRelationshipAgent", desc: "人物关系分析智能体" },
    ],
  },
  {
    category: "评估层智能体",
    items: [
      { name: "IPEvaluationAgent", desc: "IP初筛评估智能体" },
      { name: "ScriptEvaluationAgent", desc: "剧本评估智能体" },
      { name: "NovelScreeningAgent", desc: "小说初筛评估智能体" },
      { name: "StoryEvaluationAgent", desc: "故事评估智能体" },
    ],
  },
  {
    category: "分析层智能体",
    items: [
      { name: "SeriesAnalysisAgent", desc: "剧集分析智能体" },
      { name: "DramaAnalysisAgent", desc: "短剧分析智能体" },
      { name: "PlotPointsAnalyzerAgent", desc: "情节点分析智能体" },
      { name: "StorySummaryAgent", desc: "故事大纲智能体" },
    ],
  },
  {
    category: "工具层智能体",
    items: [
      { name: "TextProcessorAgent", desc: "文本处理智能体" },
      { name: "WebSearchAgent", desc: "网络搜索智能体" },
      { name: "KnowledgeAgent", desc: "知识库检索智能体" },
      { name: "FileReferenceAgent", desc: "文件引用智能体" },
    ],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableKnowledge, setEnableKnowledge] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      navigate("/chat");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-10 animate-pulse" />
          
          <div className="container max-w-4xl mx-auto relative">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                AI影视创作工坊
              </h1>
              <p className="text-xl text-muted-foreground">
                智能化影视内容创作与评估平台
              </p>
            </div>

            <Card className="p-6 border-border/50 shadow-card backdrop-blur animate-scale-in">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="输入您的创作需求或问题..."
                    className="flex-1 h-12 text-lg"
                  />
                  <Button
                    onClick={handleSearch}
                    className="h-12 px-8 gradient-primary text-white shadow-glow hover:shadow-glow"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    开始创作
                  </Button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enableWebSearch}
                      onCheckedChange={setEnableWebSearch}
                    />
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm">联网搜索</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enableKnowledge}
                      onCheckedChange={setEnableKnowledge}
                    />
                    <Database className="h-4 w-4 text-accent" />
                    <span className="text-sm">连接知识库</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Agents Section */}
        <section className="py-16 px-4 bg-card/30">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                智能体生态
              </h2>
              <p className="text-muted-foreground">
                多层次智能体协同工作，提供全流程创作支持
              </p>
            </div>

            <div className="space-y-8">
              {agents.map((category, idx) => (
                <div
                  key={category.category}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((agent) => (
                      <Card
                        key={agent.name}
                        className="p-4 border-border/50 hover:border-primary/50 hover:shadow-card transition-all duration-300 hover:scale-105 cursor-pointer group"
                      >
                        <h4 className="font-semibold mb-2 text-primary group-hover:text-accent transition-colors">
                          {agent.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {agent.desc}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                核心功能
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "竖屏短剧策划", desc: "基于爆款引擎理论的策划方案" },
                { title: "故事创作分析", desc: "五元素深度分析与结构解析" },
                { title: "内容评估系统", desc: "多维度评分和等级评定" },
                { title: "剧集深度分析", desc: "已播剧集拉片分析" },
                { title: "智能搜索", desc: "实时搜索与知识库检索" },
                { title: "工作流编排", desc: "智能任务分解与并发控制" },
              ].map((feature, idx) => (
                <Card
                  key={feature.title}
                  className="p-6 border-border/50 hover:shadow-card transition-all duration-300 hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <h3 className="text-lg font-semibold mb-2 text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
