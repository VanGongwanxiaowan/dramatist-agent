import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, Database, Sparkles, ArrowRight, Play, Zap, Star, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";

const agents = [
  {
    category: "🎯 核心创作智能体",
    items: [
      { 
        name: "短剧策划智能体", 
        desc: "基于爆款引擎理论的短剧整体策划，负责创意构思、市场分析、用户画像和竞品分析，为短剧创作提供专业指导" 
      },
      { 
        name: "短剧创作智能体", 
        desc: "专业的剧本创作引擎，负责对话生成、场景描述、角色塑造和内容优化，生成完整的短剧剧本" 
      },
      { 
        name: "剧本评估智能体", 
        desc: "多维度质量评估系统，提供结构分析、改进建议、评分系统和商业价值评估，确保剧本质量" 
      },
    ],
  },
  {
    category: "📊 故事分析智能体",
    items: [
      { 
        name: "故事五元素分析器", 
        desc: "深度解析故事的五元素结构，进行主题识别、情感分析和结构解析，为故事创作提供科学依据" 
      },
      { 
        name: "角色档案生成器", 
        desc: "智能生成详细角色档案和背景故事，包含性格分析、关系网络和角色发展轨迹" 
      },
      { 
        name: "角色关系分析器", 
        desc: "分析角色间的复杂关系网络，构建互动图谱，优化角色间的冲突和合作设计" 
      },
      { 
        name: "故事类型分析器", 
        desc: "智能识别故事类型特征，进行类型分类和特征分析，帮助确定创作方向" 
      },
      { 
        name: "戏剧分析器", 
        desc: "专业分析戏剧结构和表演元素，提供舞台分析、表演指导和戏剧效果评估" 
      },
    ],
  },
  {
    category: "📈 情节点开发智能体",
    items: [
      { 
        name: "大情节点工作流", 
        desc: "完整的情节点生成工作流，负责情节点生成、结构规划、节奏控制和冲突设计" 
      },
      { 
        name: "大情节点分析器", 
        desc: "分析故事的大情节点结构，进行情节点分析、结构优化、节奏调整和冲突升级" 
      },
      { 
        name: "详细情节点生成器", 
        desc: "生成详细的情节点描述，包含场景描述、细节生成和情节发展轨迹" 
      },
      { 
        name: "情节点分析器", 
        desc: "分析情节发展的关键节点，识别情节点发展轨迹和关键转折点" 
      },
      { 
        name: "故事大纲生成器", 
        desc: "智能生成故事大纲和概要，提取关键信息、结构梳理和内容组织" 
      },
      { 
        name: "思维导图生成器", 
        desc: "可视化故事结构，生成思维导图，帮助理解故事脉络和逻辑关系" 
      },
    ],
  },
  {
    category: "🔍 评估分析智能体",
    items: [
      { 
        name: "IP价值评估器", 
        desc: "专业评估IP的商业价值和市场潜力，分析IP的变现能力和投资价值" 
      },
      { 
        name: "剧本评估器", 
        desc: "多维度剧本质量评估，提供质量分析、改进建议和评分系统" 
      },
      { 
        name: "故事大纲评估器", 
        desc: "评估故事大纲的完整性和质量，进行完整性检查和质量评分" 
      },
      { 
        name: "故事评估器", 
        desc: "综合评估故事整体质量，提供整体分析和质量报告" 
      },
      { 
        name: "小说筛选评估器", 
        desc: "评估小说质量和商业价值，进行小说筛选和质量评估" 
      },
      { 
        name: "文本处理评估器", 
        desc: "评估文本处理质量和准确性，进行质量检查和准确性验证" 
      },
    ],
  },
  {
    category: "🎬 剧集分析智能体",
    items: [
      { 
        name: "已播剧集分析器", 
        desc: "深度分析已播剧集的特点和规律，提取成功要素、模式识别和趋势分析" 
      },
      { 
        name: "剧集信息获取器", 
        desc: "获取剧集的基础信息和数据，提供全面的剧集信息支持" 
      },
      { 
        name: "剧集名称提取器", 
        desc: "智能提取剧集名称和信息，进行信息识别和智能解析" 
      },
      { 
        name: "系列分析编排器", 
        desc: "协调系列分析的复杂流程，进行流程编排、任务调度和结果整合" 
      },
    ],
  },
  {
    category: "🛠️ 工具支持智能体",
    items: [
      { 
        name: "网络搜索助手", 
        desc: "提供实时网络搜索和信息收集，支持数据验证、趋势分析和实时信息获取" 
      },
      { 
        name: "知识库查询助手", 
        desc: "从知识库中检索相关信息，提供信息提取、内容匹配和智能推荐" 
      },
      { 
        name: "文件引用解析助手", 
        desc: "解析和处理文件引用，进行文件解析、引用提取和内容分析" 
      },
      { 
        name: "文档生成器", 
        desc: "生成各类格式的文档，支持格式转换、内容整理和文档优化" 
      },
      { 
        name: "输出格式化器", 
        desc: "格式化输出内容，提升可读性，进行格式优化、内容美化和结构整理" 
      },
      { 
        name: "文本分割器", 
        desc: "智能分割长文本内容，进行文本分割、智能切分和内容重组" 
      },
      { 
        name: "文本截断器", 
        desc: "智能截断过长文本，进行长度控制和内容精简" 
      },
      { 
        name: "评分分析器", 
        desc: "分析评分数据和趋势，提供数据统计和趋势分析" 
      },
    ],
  },
  {
    category: "⚙️ 工作流编排智能体",
    items: [
      { 
        name: "剧本文本编排器", 
        desc: "协调整体创作流程和智能体协作，进行整体编排、智能体协作和流程优化" 
      },
      { 
        name: "剧本文本管家", 
        desc: "提供综合服务，智能路由和协调，统一管理各种智能体服务" 
      },
      { 
        name: "戏剧工作流管理器", 
        desc: "管理戏剧创作的完整流程，进行工作流管理、流程控制和任务协调" 
      },
      { 
        name: "结果整合器", 
        desc: "整合多个分析结果，生成综合报告，进行结果整合、报告生成和综合分析" 
      },
    ],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableKnowledge, setEnableKnowledge] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // 监听滚动和可见性
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      navigate("/chat", { state: { query, enableWebSearch, enableKnowledge } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="AI短剧创作工坊 - 专业智能体协作平台"
        description="基于爆款引擎理论的智能短剧策划与创作平台，提供40+专业AI智能体支持，覆盖从策划到评估的完整创作流程。体验最先进的AI短剧创作技术。"
        keywords="AI短剧,智能体协作,剧本创作,故事分析,角色开发,情节点,IP评估,短剧策划,AI创作,影视制作"
        url={window.location.origin}
      />
      <Header />
      
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className="relative py-20 px-4 overflow-hidden min-h-[80vh] flex items-center"
        >
          {/* 动态背景 */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 gradient-hero opacity-5" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float-slow" />
          </div>
          
          <div className="container max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 mb-6">
                <Badge variant="secondary" className="animate-bounce-gentle">
                  <Sparkles className="w-3 h-3 mr-1" />
                  专业AI短剧创作平台
                </Badge>
              </div>
              
              <h1 className={cn(
                "text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight",
                "text-gradient animate-shimmer bg-[length:200%_auto]",
                isVisible ? "animate-scale-in" : "opacity-0"
              )}>
                🎬 AI短剧创作工坊
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                基于爆款引擎理论的智能短剧策划与创作平台，提供全流程AI智能体支持
              </p>

              {/* 统计数据 */}
              <div className="flex justify-center gap-8 mb-12">
                {[
                  { icon: Users, label: "40+", desc: "专业智能体" },
                  { icon: TrendingUp, label: "95%", desc: "成功率" },
                  { icon: Star, label: "10K+", desc: "创作项目" },
                  { icon: Zap, label: "24/7", desc: "智能协作" }
                ].map((stat, index) => (
                  <div 
                    key={stat.label}
                    className={cn(
                      "text-center animate-fade-in-delayed",
                      isVisible ? "opacity-100" : "opacity-0"
                    )}
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className="w-6 h-6 text-primary mr-2" />
                      <span className="text-3xl font-bold text-gradient">{stat.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="glass-card p-8 max-w-4xl mx-auto animate-scale-in">
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="告诉我您想创作什么类型的短剧内容..."
                      className="h-14 text-lg pr-12 border-2 focus:border-primary/50 transition-all duration-300"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0"
                      onClick={handleSearch}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    className="h-14 px-8 gradient-button text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    🚀 开始创作
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-6 justify-center">
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <Switch
                      checked={enableWebSearch}
                      onCheckedChange={setEnableWebSearch}
                    />
                    <Globe className="h-5 w-5 text-primary group-hover:animate-spin transition-all duration-300" />
                    <span className="text-sm font-medium">联网搜索</span>
                  </div>
                  <div className="flex items-center gap-3 group cursor-pointer">
                    <Switch
                      checked={enableKnowledge}
                      onCheckedChange={setEnableKnowledge}
                    />
                    <Database className="h-5 w-5 text-accent group-hover:animate-pulse transition-all duration-300" />
                    <span className="text-sm font-medium">连接知识库</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Agents Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-card/30 to-background relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          </div>

          <div className="container max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 mb-6">
                <Badge variant="secondary" className="animate-pulse-soft">
                  <Bot className="w-3 h-3 mr-1" />
                  智能体生态
                </Badge>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
                🤖 专业AI智能体团队
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                7大类别、40+专业智能体，覆盖短剧创作全流程，从策划到评估的完整AI支持体系
              </p>
            </div>

            <div className="space-y-12">
              {agents.map((category, idx) => (
                <div
                  key={category.category}
                  className="animate-fade-in-delayed"
                  style={{ animationDelay: `${idx * 200}ms` }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient">
                      {category.category}
                    </h3>
                  </div>
                  
                  <div className="responsive-grid gap-6">
                    {category.items.map((agent, agentIdx) => (
                      <Card
                        key={agent.name}
                        className={cn(
                          "glass-card p-6 interactive-card group",
                          "hover:border-primary/30 transition-all duration-300"
                        )}
                        style={{ animationDelay: `${(idx * 200) + (agentIdx * 100)}ms` }}
                      >
                        <CardContent className="p-0">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold mb-2 text-primary group-hover:text-accent transition-colors duration-300">
                                {agent.name}
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {agent.desc}
                              </p>
                            </div>
                            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <ArrowRight className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          
                          {/* 智能体状态指示器 */}
                          <div className="flex items-center gap-2 mt-4">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-600 font-medium">在线</span>
                            <div className="ml-auto">
                              <Badge variant="outline" className="text-xs">
                                智能体
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-card/20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 mb-6">
                <Badge variant="secondary" className="animate-bounce-gentle">
                  <Zap className="w-3 h-3 mr-1" />
                  核心功能
                </Badge>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
                ✨ 核心功能
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                全方位的AI创作工具，让您的短剧创作更加专业高效
              </p>
            </div>

            <div className="responsive-grid gap-8">
              {[
                { 
                  title: "🎬 竖屏短剧策划", 
                  desc: "基于爆款引擎理论的智能策划，包含市场分析、用户画像和竞品分析",
                  icon: "🎬",
                  gradient: "from-red-500 to-pink-500"
                },
                { 
                  title: "📖 故事五元素分析", 
                  desc: "深度解析故事结构，进行主题识别、情感分析和结构解析",
                  icon: "📖",
                  gradient: "from-blue-500 to-cyan-500"
                },
                { 
                  title: "👥 角色开发系统", 
                  desc: "智能生成角色档案，分析角色关系和互动网络",
                  icon: "👥",
                  gradient: "from-green-500 to-emerald-500"
                },
                { 
                  title: "📈 情节点工作流", 
                  desc: "完整的情节点生成流程，包含结构规划、节奏控制和冲突设计",
                  icon: "📈",
                  gradient: "from-purple-500 to-violet-500"
                },
                { 
                  title: "⭐ 多维度评估", 
                  desc: "IP价值评估、剧本质量分析、故事评估和商业价值分析",
                  icon: "⭐",
                  gradient: "from-yellow-500 to-orange-500"
                },
                { 
                  title: "🔍 剧集深度分析", 
                  desc: "已播剧集拉片分析，提取成功要素和模式识别",
                  icon: "🔍",
                  gradient: "from-indigo-500 to-blue-500"
                },
                { 
                  title: "🔎 智能搜索工具", 
                  desc: "实时网络搜索与知识库检索，支持数据验证和趋势分析",
                  icon: "🔎",
                  gradient: "from-teal-500 to-green-500"
                },
                { 
                  title: "⚡ 工作流编排", 
                  desc: "智能任务分解与并发控制，协调多智能体协作",
                  icon: "⚡",
                  gradient: "from-orange-500 to-red-500"
                },
                { 
                  title: "📊 思维导图生成", 
                  desc: "可视化故事结构，帮助理解故事脉络和逻辑关系",
                  icon: "📊",
                  gradient: "from-pink-500 to-purple-500"
                },
              ].map((feature, idx) => (
                <Card
                  key={feature.title}
                  className={cn(
                    "floating-card p-8 interactive-card group",
                    "hover:border-primary/30 transition-all duration-500"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl bg-gradient-to-r flex items-center justify-center text-2xl",
                        `bg-gradient-to-r ${feature.gradient}`,
                        "group-hover:scale-110 transition-transform duration-300"
                      )}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-3 text-gradient group-hover:text-primary transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                    
                    {/* 功能状态 */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">可用</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
            <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>

          <div className="container max-w-4xl mx-auto text-center relative z-10">
            <div className="animate-scale-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
                🚀 开始您的AI创作之旅
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                立即体验最先进的AI短剧创作平台，让创意与技术完美融合
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => navigate("/chat")}
                  className="h-14 px-8 gradient-button text-white shadow-glow text-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  立即开始创作
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate("/agents")}
                  variant="outline"
                  className="h-14 px-8 border-2 hover:bg-primary/10 text-lg"
                >
                  <Bot className="h-5 w-5 mr-2" />
                  探索智能体
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
