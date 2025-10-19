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
  { value: "planner", label: "短剧策划智能体", description: "负责短剧的整体策划和创意构思" },
  { value: "creator", label: "短剧创作智能体", description: "负责具体的剧本创作和内容生成" },
  { value: "evaluation", label: "剧本评估智能体", description: "负责剧本质量评估和改进建议" },
  { value: "websearch", label: "网络搜索助手", description: "提供实时网络搜索和信息收集" },
  { value: "knowledge", label: "知识库查询助手", description: "从知识库中检索相关信息" },
  { value: "file-reference", label: "文件引用解析助手", description: "解析和处理文件引用" },
  { value: "story-analysis", label: "故事五元素分析", description: "分析故事的五元素结构" },
  { value: "series-analysis", label: "已播剧集分析", description: "分析已播剧集的特点和规律" },
  { value: "plot-points-workflow", label: "大情节点工作流", description: "生成大情节点和详细情节点" },
  { value: "story-summary", label: "故事大纲生成", description: "生成故事大纲和概要" },
  { value: "major-plot-points", label: "大情节点分析", description: "分析故事的大情节点结构" },
];

const Agents = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [dbAPI, setDbAPI] = useState<any>(null);

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
      // 如果数据库加载失败，使用模拟数据
      const mockAgents: AgentStatus[] = agentTypes.map((type) => ({
        id: type.value,
        name: type.label,
        description: type.description,
        capabilities: getCapabilities(type.value),
        status: 'active',
        isRunning: false,
        lastUsed: undefined,
        usageCount: 0,
      }));
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  };

  const getCapabilities = (agentType: string): string[] => {
    const capabilityMap: Record<string, string[]> = {
      planner: ['创意构思', '市场分析', '用户画像', '竞品分析'],
      creator: ['剧本创作', '对话生成', '场景描述', '角色塑造'],
      evaluation: ['质量评估', '结构分析', '改进建议', '评分系统'],
      websearch: ['实时搜索', '信息收集', '数据验证', '趋势分析'],
      knowledge: ['知识检索', '信息提取', '内容匹配', '智能推荐'],
      'file-reference': ['文件解析', '引用提取', '内容分析', '结构识别'],
      'story-analysis': ['五元素分析', '结构解析', '主题识别', '情感分析'],
      'series-analysis': ['剧集分析', '模式识别', '趋势预测', '成功要素'],
      'plot-points-workflow': ['情节点生成', '结构规划', '节奏控制', '冲突设计'],
      'story-summary': ['大纲生成', '概要提取', '关键信息', '结构梳理'],
      'major-plot-points': ['情节点分析', '结构优化', '节奏调整', '冲突升级'],
    };
    return capabilityMap[agentType] || [];
  };

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

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(agent.status, agent.isRunning)}
                      {getStatusBadge(agent.status, agent.isRunning)}
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
