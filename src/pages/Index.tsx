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
                🎬 AI短剧创作工坊
              </h1>
              <p className="text-xl text-muted-foreground">
                基于爆款引擎理论的智能短剧策划与创作平台，提供全流程AI智能体支持
              </p>
            </div>

            <Card className="p-6 border-border/50 shadow-card backdrop-blur animate-scale-in">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="告诉我您想创作什么类型的短剧内容..."
                    className="flex-1 h-12 text-lg"
                  />
                  <Button
                    onClick={handleSearch}
                    className="h-12 px-8 gradient-primary text-white shadow-glow hover:shadow-glow"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    🚀 开始创作
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
                🤖 专业AI智能体团队
              </h2>
              <p className="text-muted-foreground">
                7大类别、40+专业智能体，覆盖短剧创作全流程，从策划到评估的完整AI支持体系
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
                ✨ 核心功能
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "🎬 竖屏短剧策划", desc: "基于爆款引擎理论的智能策划，包含市场分析、用户画像和竞品分析" },
                { title: "📖 故事五元素分析", desc: "深度解析故事结构，进行主题识别、情感分析和结构解析" },
                { title: "👥 角色开发系统", desc: "智能生成角色档案，分析角色关系和互动网络" },
                { title: "📈 情节点工作流", desc: "完整的情节点生成流程，包含结构规划、节奏控制和冲突设计" },
                { title: "⭐ 多维度评估", desc: "IP价值评估、剧本质量分析、故事评估和商业价值分析" },
                { title: "🔍 剧集深度分析", desc: "已播剧集拉片分析，提取成功要素和模式识别" },
                { title: "🔎 智能搜索工具", desc: "实时网络搜索与知识库检索，支持数据验证和趋势分析" },
                { title: "⚡ 工作流编排", desc: "智能任务分解与并发控制，协调多智能体协作" },
                { title: "📊 思维导图生成", desc: "可视化故事结构，帮助理解故事脉络和逻辑关系" },
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
