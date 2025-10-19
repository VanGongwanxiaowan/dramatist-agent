/**
 * 智能体管理页面
 * 展示和管理各种智能体的状态和功能
 */

import { useState, useEffect } from "react";
import { Bot, Play, Square, Loader2, Info, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import { jubenApi, AgentInfo } from "@/lib/api";
import { createDatabaseAPI } from "@/lib/database";

interface AgentStatus extends AgentInfo {
  isRunning?: boolean;
  lastUsed?: string;
  usageCount?: number;
  totalTokens?: number;
  totalCost?: number;
}

const agentTypes = [
  // 核心创作智能体
  { value: "planner", label: "短剧策划智能体", description: "负责短剧的整体策划和创意构思，基于爆款引擎理论", category: "创作核心" },
  { value: "creator", label: "短剧创作智能体", description: "负责具体的剧本创作和内容生成，生成完整剧本", category: "创作核心" },
  { value: "evaluation", label: "剧本评估智能体", description: "负责剧本质量评估和改进建议，多维度评估", category: "创作核心" },
  
  // 分析智能体
  { value: "story-analysis", label: "故事五元素分析", description: "分析故事的五元素结构，深入解析故事核心", category: "分析工具" },
  { value: "series-analysis", label: "已播剧集分析", description: "分析已播剧集的特点和规律，提取成功要素", category: "分析工具" },
  { value: "story-five-elements", label: "故事五要素分析器", description: "专门分析故事的五要素结构", category: "分析工具" },
  { value: "character-profile-generator", label: "角色档案生成器", description: "生成详细的角色档案和背景故事", category: "分析工具" },
  { value: "character-relationship-analyzer", label: "角色关系分析器", description: "分析角色间的关系网络和互动", category: "分析工具" },
  { value: "story-type-analyzer", label: "故事类型分析器", description: "识别和分析故事的类型特征", category: "分析工具" },
  { value: "drama-analysis", label: "戏剧分析器", description: "分析戏剧结构和表演元素", category: "分析工具" },
  
  // 情节点智能体
  { value: "plot-points-workflow", label: "大情节点工作流", description: "生成大情节点和详细情节点，完整工作流", category: "情节点" },
  { value: "plot-points-analyzer", label: "情节点分析器", description: "分析情节发展的关键节点", category: "情节点" },
  { value: "detailed-plot-points", label: "详细情节点生成器", description: "生成详细的情节点描述", category: "情节点" },
  { value: "major-plot-points", label: "大情节点分析器", description: "分析故事的大情节点结构", category: "情节点" },
  { value: "story-summary", label: "故事大纲生成器", description: "生成故事大纲和概要", category: "情节点" },
  { value: "mind-map", label: "思维导图生成器", description: "生成故事思维导图，可视化结构", category: "情节点" },
  
  // 评估智能体
  { value: "script-evaluation", label: "剧本评估器", description: "专业剧本评估，多维度分析", category: "评估工具" },
  { value: "story-outline-evaluation", label: "故事大纲评估器", description: "评估故事大纲的质量和完整性", category: "评估工具" },
  { value: "story-evaluation", label: "故事评估器", description: "综合评估故事的整体质量", category: "评估工具" },
  { value: "novel-screening-evaluation", label: "小说筛选评估器", description: "评估小说质量和商业价值", category: "评估工具" },
  { value: "text-processor-evaluation", label: "文本处理评估器", description: "评估文本处理的质量和准确性", category: "评估工具" },
  { value: "result-analyzer-evaluation", label: "结果分析评估器", description: "分析评估结果的可靠性", category: "评估工具" },
  { value: "ip-evaluation", label: "IP价值评估器", description: "评估IP的商业价值和潜力", category: "评估工具" },
  
  // 工具智能体
  { value: "websearch", label: "网络搜索助手", description: "提供实时网络搜索和信息收集", category: "工具" },
  { value: "knowledge", label: "知识库查询助手", description: "从知识库中检索相关信息", category: "工具" },
  { value: "file-reference", label: "文件引用解析助手", description: "解析和处理文件引用", category: "工具" },
  { value: "document-generator", label: "文档生成器", description: "生成各类格式的文档", category: "工具" },
  { value: "output-formatter", label: "输出格式化器", description: "格式化输出内容，提升可读性", category: "工具" },
  { value: "text-splitter", label: "文本分割器", description: "智能分割长文本内容", category: "工具" },
  { value: "text-truncator", label: "文本截断器", description: "智能截断过长文本", category: "工具" },
  { value: "score-analyzer", label: "评分分析器", description: "分析评分数据和趋势", category: "工具" },
  
  // 工作流智能体
  { value: "drama-workflow", label: "戏剧工作流管理器", description: "管理戏剧创作的完整流程", category: "工作流" },
  { value: "series-analysis-orchestrator", label: "系列分析编排器", description: "协调系列分析的复杂流程", category: "工作流" },
  { value: "juben-orchestrator", label: "剧本文本编排器", description: "协调整体创作流程和智能体协作", category: "工作流" },
  { value: "juben-concierge", label: "剧本文本管家", description: "提供综合服务，智能路由和协调", category: "工作流" },
  
  // 信息智能体
  { value: "series-info", label: "剧集信息获取器", description: "获取剧集的基础信息和数据", category: "信息" },
  { value: "series-name-extractor", label: "剧集名称提取器", description: "智能提取剧集名称和信息", category: "信息" },
  { value: "result-integrator", label: "结果整合器", description: "整合多个分析结果，生成综合报告", category: "信息" },
];

const Agents = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [dbAPI, setDbAPI] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      // 初始化数据库连接
      const userId = "demo_user_001";
      const databaseAPI = createDatabaseAPI(userId);
      setDbAPI(databaseAPI);

      // 获取Token使用统计
      const tokenStats = await databaseAPI.getTokenUsageStats();
      
      // 获取Token使用历史，按智能体分组统计
      const tokenHistory = await databaseAPI.getTokenUsageHistory(1000);
      const agentUsageStats = tokenHistory.reduce((acc: any, usage: any) => {
        if (!acc[usage.agent_name]) {
          acc[usage.agent_name] = {
            usageCount: 0,
            totalTokens: 0,
            lastUsed: null,
            totalCost: 0,
          };
        }
        acc[usage.agent_name].usageCount++;
        acc[usage.agent_name].totalTokens += usage.total_tokens;
        acc[usage.agent_name].totalCost += usage.cost_points;
        if (!acc[usage.agent_name].lastUsed || usage.request_timestamp > acc[usage.agent_name].lastUsed) {
          acc[usage.agent_name].lastUsed = usage.request_timestamp;
        }
        return acc;
      }, {});

      // 构建智能体状态数据
      const agentsWithRealData: AgentStatus[] = agentTypes.map((type) => {
        const usage = agentUsageStats[type.value] || {
          usageCount: 0,
          totalTokens: 0,
          lastUsed: null,
          totalCost: 0,
        };

        return {
          id: type.value,
          name: type.label,
          description: type.description,
          capabilities: getCapabilities(type.value),
          status: usage.usageCount > 0 ? 'active' : 'inactive',
          isRunning: false, // 这个需要实时监控
          lastUsed: usage.lastUsed,
          usageCount: usage.usageCount,
          totalTokens: usage.totalTokens,
          totalCost: usage.totalCost,
        };
      });
      
      setAgents(agentsWithRealData);
    } catch (error) {
      console.error('加载智能体失败:', error);
      // 保持空数组，避免伪数据，确保只展示真实数据库数据
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const getCapabilities = (agentType: string): string[] => {
    const capabilityMap: Record<string, string[]> = {
      // 创作核心
      planner: ['创意构思', '市场分析', '用户画像', '竞品分析', '爆款引擎理论'],
      creator: ['剧本创作', '对话生成', '场景描述', '角色塑造', '内容优化'],
      evaluation: ['质量评估', '结构分析', '改进建议', '评分系统', '多维度评估'],
      
      // 分析工具
      'story-analysis': ['五元素分析', '结构解析', '主题识别', '情感分析'],
      'series-analysis': ['剧集分析', '模式识别', '趋势预测', '成功要素'],
      'story-five-elements': ['五要素分析', '结构解析', '要素提取'],
      'character-profile-generator': ['角色档案', '背景故事', '性格分析'],
      'character-relationship-analyzer': ['关系分析', '互动网络', '关系图谱'],
      'story-type-analyzer': ['类型识别', '特征分析', '分类管理'],
      'drama-analysis': ['戏剧结构', '表演元素', '舞台分析'],
      
      // 情节点
      'plot-points-workflow': ['情节点生成', '结构规划', '节奏控制', '冲突设计'],
      'plot-points-analyzer': ['情节点分析', '发展轨迹', '关键点识别'],
      'detailed-plot-points': ['详细情节', '场景描述', '细节生成'],
      'major-plot-points': ['情节点分析', '结构优化', '节奏调整', '冲突升级'],
      'story-summary': ['大纲生成', '概要提取', '关键信息', '结构梳理'],
      'mind-map': ['思维导图', '可视化', '结构展示'],
      
      // 评估工具
      'script-evaluation': ['剧本评估', '质量分析', '改进建议'],
      'story-outline-evaluation': ['大纲评估', '完整性检查', '质量评分'],
      'story-evaluation': ['综合评估', '整体分析', '质量报告'],
      'novel-screening-evaluation': ['小说筛选', '质量评估', '商业价值'],
      'text-processor-evaluation': ['文本处理', '质量检查', '准确性验证'],
      'result-analyzer-evaluation': ['结果分析', '可靠性验证', '数据解读'],
      'ip-evaluation': ['IP评估', '商业价值', '潜力分析'],
      
      // 工具
      websearch: ['实时搜索', '信息收集', '数据验证', '趋势分析'],
      knowledge: ['知识检索', '信息提取', '内容匹配', '智能推荐'],
      'file-reference': ['文件解析', '引用提取', '内容分析', '结构识别'],
      'document-generator': ['文档生成', '格式转换', '内容整理'],
      'output-formatter': ['格式优化', '内容美化', '结构整理'],
      'text-splitter': ['文本分割', '智能切分', '内容重组'],
      'text-truncator': ['文本截断', '长度控制', '内容精简'],
      'score-analyzer': ['评分分析', '数据统计', '趋势分析'],
      
      // 工作流
      'drama-workflow': ['工作流管理', '流程控制', '任务协调'],
      'series-analysis-orchestrator': ['流程编排', '任务调度', '结果整合'],
      'juben-orchestrator': ['整体编排', '智能体协作', '流程优化'],
      'juben-concierge': ['综合服务', '智能路由', '协调管理'],
      
      // 信息
      'series-info': ['信息获取', '数据收集', '基础信息'],
      'series-name-extractor': ['名称提取', '信息识别', '智能解析'],
      'result-integrator': ['结果整合', '报告生成', '综合分析'],
    };
    return capabilityMap[agentType] || ['基础功能'];
  };

  // 获取所有分类
  const categories = ["all", ...Array.from(new Set(agentTypes.map(agent => agent.category)))];
  
  // 过滤智能体
  const filteredAgents = agents.filter(agent => {
    const matchesCategory = selectedCategory === "all" || 
      agentTypes.find(type => type.value === agent.id)?.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string, isRunning?: boolean) => {
    if (isRunning) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string, isRunning?: boolean) => {
    if (isRunning) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">运行中</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">活跃</Badge>;
      case 'inactive':
        return <Badge variant="destructive">离线</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const handleGetAgentInfo = async (agentType: string) => {
    try {
      const info = await jubenApi.getAgentInfo(agentType);
      setAgentInfo(info);
      setSelectedAgent(agentType);
    } catch (error) {
      console.error('获取智能体信息失败:', error);
      // 使用模拟数据
      const agent = agents.find(a => a.id === agentType);
      if (agent) {
        setAgentInfo({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities,
          status: agent.status,
        });
        setSelectedAgent(agentType);
      }
    }
  };

  const handleTestAgent = async (agentType: string) => {
    try {
      // 模拟测试智能体
      console.log(`测试智能体: ${agentType}`);
      // 这里可以调用实际的测试API
    } catch (error) {
      console.error('测试智能体失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载智能体中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">智能体管理</h1>
            <p className="text-muted-foreground">
              管理和监控各种智能体的状态，查看其功能和性能指标
            </p>
          </div>

          {/* 过滤器和搜索 */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索智能体..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有分类</option>
                {categories.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mb-4 text-sm text-muted-foreground">
            共 {filteredAgents.length} 个智能体，其中 {filteredAgents.filter(a => a.status === 'active').length} 个活跃
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(agent.status, agent.isRunning)}
                      {getStatusBadge(agent.status, agent.isRunning)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {agentTypes.find(type => type.value === agent.id)?.category || '未分类'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {agent.description}
                    </p>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">核心能力:</h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 3).map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>使用次数: {agent.usageCount || 0}</span>
                        {agent.lastUsed && (
                          <span>最后使用: {new Date(agent.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                      {(agent.totalTokens || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span>总Token: {agent.totalTokens?.toLocaleString() || 0}</span>
                          <span>总成本: {agent.totalCost?.toFixed(2) || 0} 积分</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleGetAgentInfo(agent.id)}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            详情
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Bot className="h-5 w-5" />
                              {agentInfo?.name || agent.name}
                            </DialogTitle>
                            <DialogDescription>
                              {agentInfo?.description || agent.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">状态信息</h4>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(agent.status, agent.isRunning)}
                                {getStatusBadge(agent.status, agent.isRunning)}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">核心能力</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {(agentInfo?.capabilities || agent.capabilities).map((capability) => (
                                  <Badge key={capability} variant="outline" className="justify-center">
                                    {capability}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">使用次数:</span>
                                <span className="ml-2 font-medium">{agent.usageCount || 0}</span>
                              </div>
                              {agent.lastUsed && (
                                <div>
                                  <span className="text-muted-foreground">最后使用:</span>
                                  <span className="ml-2 font-medium">
                                    {new Date(agent.lastUsed).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleTestAgent(agent.id)}
                        disabled={agent.status === 'inactive'}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        测试
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Agents;
