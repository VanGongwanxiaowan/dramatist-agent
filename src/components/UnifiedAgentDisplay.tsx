/**
 * 统一Agent显示组件
 * 生产级别的Agent信息展示和状态管理
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Sparkles,
  Brain,
  PenTool,
  BarChart3,
  Lightbulb,
  Users,
  Film,
  BookOpen,
  Clock,
  Zap,
  Activity,
  TrendingUp,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== 类型定义 ====================

export interface AgentInfo {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: 'concierge' | 'orchestrator' | 'creation' | 'analysis' | 'evaluation' | 'workflow' | 'tool';
  version: string;
  capabilities: string[];
  icon?: string;
  color?: string;
  status: 'idle' | 'thinking' | 'working' | 'completed' | 'error' | 'stopped';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: 'user_message' | 'assistant_message' | 'system_message' | 'agent_thinking' | 'agent_action' | 'agent_result' | 'agent_error' | 'agent_complete';
  content: string;
  content_format: 'text' | 'markdown' | 'json' | 'html';
  agent_id?: string;
  agent_name?: string;
  agent_status?: string;
  metadata: Record<string, any>;
  timestamp: string;
  is_streaming: boolean;
  is_complete: boolean;
  stream_index?: number;
  processing_time?: number;
  token_usage?: Record<string, number>;
  cost_points?: number;
}

export interface AgentExecution {
  id: string;
  session_id: string;
  agent_id: string;
  execution_type: string;
  status: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  token_usage?: Record<string, number>;
  cost_points?: number;
  error_message?: string;
  metadata: Record<string, any>;
}

// ==================== Agent配置 ====================

const AGENT_CATEGORY_CONFIG = {
  concierge: {
    name: "接待员",
    icon: <Users className="w-4 h-4" />,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700"
  },
  orchestrator: {
    name: "编排器",
    icon: <Sparkles className="w-4 h-4" />,
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700"
  },
  creation: {
    name: "创作类",
    icon: <PenTool className="w-4 h-4" />,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700"
  },
  analysis: {
    name: "分析类",
    icon: <Brain className="w-4 h-4" />,
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700"
  },
  evaluation: {
    name: "评估类",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "bg-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700"
  },
  workflow: {
    name: "工作流",
    icon: <Film className="w-4 h-4" />,
    color: "bg-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700"
  },
  tool: {
    name: "工具类",
    icon: <BookOpen className="w-4 h-4" />,
    color: "bg-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700"
  }
};

const MESSAGE_TYPE_CONFIG = {
  user_message: {
    name: "用户消息",
    icon: <Users className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  assistant_message: {
    name: "助手回复",
    icon: <Bot className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  agent_thinking: {
    name: "思考中",
    icon: <Brain className="w-4 h-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  agent_action: {
    name: "执行中",
    icon: <Zap className="w-4 h-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  agent_result: {
    name: "结果输出",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  agent_error: {
    name: "执行错误",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  agent_complete: {
    name: "执行完成",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  }
};

// ==================== 状态图标组件 ====================

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'thinking':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case 'working':
      return <Activity className="w-4 h-4 animate-pulse text-orange-500" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'stopped':
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

// ==================== Agent信息卡片组件 ====================

interface AgentInfoCardProps {
  agent: AgentInfo;
  isActive?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

export const AgentInfoCard: React.FC<AgentInfoCardProps> = ({
  agent,
  isActive = false,
  showDetails = false,
  onToggleDetails,
  className
}) => {
  const categoryConfig = AGENT_CATEGORY_CONFIG[agent.category] || AGENT_CATEGORY_CONFIG.tool;
  
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-md",
      isActive && "ring-2 ring-blue-200 bg-blue-50/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className={cn("text-white", categoryConfig.color)}>
                {categoryConfig.icon}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{agent.display_name}</h3>
                <StatusIcon status={agent.status} />
                <Badge variant="secondary" className="text-xs">
                  {categoryConfig.name}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">{agent.description}</p>
            </div>
          </div>
          
          {onToggleDetails && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleDetails}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 版本信息 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">版本</span>
              <span className="font-mono">{agent.version}</span>
            </div>
            
            {/* 能力列表 */}
            {agent.capabilities.length > 0 && (
              <div>
                <span className="text-xs text-gray-500">能力</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.capabilities.map((capability, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* 元数据 */}
            {Object.keys(agent.metadata).length > 0 && (
              <div>
                <span className="text-xs text-gray-500">元数据</span>
                <div className="text-xs font-mono bg-gray-100 p-2 rounded mt-1">
                  {JSON.stringify(agent.metadata, null, 2)}
                </div>
              </div>
            )}
            
            {/* 时间信息 */}
            <div className="text-xs text-gray-400">
              创建: {new Date(agent.created_at).toLocaleString()}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ==================== 消息显示组件 ====================

interface AgentMessageDisplayProps {
  message: AgentMessage;
  showAgentInfo?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export const AgentMessageDisplay: React.FC<AgentMessageDisplayProps> = ({
  message,
  showAgentInfo = true,
  showMetadata = true,
  className
}) => {
  const messageConfig = MESSAGE_TYPE_CONFIG[message.message_type] || MESSAGE_TYPE_CONFIG.assistant_message;
  
  return (
    <Card className={cn("w-full transition-all duration-300", className)}>
      <CardContent className="p-4">
        {showAgentInfo && message.agent_name && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{message.agent_name}</span>
              <StatusIcon status={message.agent_status || 'idle'} />
            </div>
            <div className="text-xs text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
        
        <div className={cn(
          "rounded-lg p-3 border-l-4",
          messageConfig.bgColor,
          messageConfig.borderColor
        )}>
          <div className="flex items-center gap-2 mb-2">
            {messageConfig.icon}
            <span className={cn("text-sm font-medium", messageConfig.color)}>
              {messageConfig.name}
            </span>
            {message.is_streaming && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600">流式输出中...</span>
              </div>
            )}
          </div>
          
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        
        {showMetadata && message.metadata && Object.keys(message.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {message.processing_time && (
                <span>处理时间: {message.processing_time.toFixed(2)}s</span>
              )}
              {message.token_usage && (
                <span>Tokens: {message.token_usage.total || 0}</span>
              )}
              {message.cost_points && (
                <span>成本: {message.cost_points.toFixed(4)}</span>
              )}
              {message.stream_index !== undefined && (
                <span>流式索引: {message.stream_index}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== Agent执行进度组件 ====================

interface AgentExecutionProgressProps {
  execution: AgentExecution;
  className?: string;
}

export const AgentExecutionProgress: React.FC<AgentExecutionProgressProps> = ({
  execution,
  className
}) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (execution.status === 'working') {
      // 模拟进度更新
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 10, 90));
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (execution.status === 'completed') {
      setProgress(100);
    }
  }, [execution.status]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="font-medium">{execution.agent_id}</span>
              <StatusIcon status={execution.status} />
            </div>
            <span className="text-sm text-gray-500">
              {execution.execution_type}
            </span>
          </div>
          
          {execution.status === 'working' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>执行进度</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {execution.duration && (
            <div className="text-xs text-gray-500">
              执行时长: {execution.duration.toFixed(2)}s
            </div>
          )}
          
          {execution.error_message && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              错误: {execution.error_message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 统一Agent显示容器 ====================

interface UnifiedAgentDisplayProps {
  agents: AgentInfo[];
  messages: AgentMessage[];
  executions: AgentExecution[];
  onAgentSelect?: (agent: AgentInfo) => void;
  onMessageSelect?: (message: AgentMessage) => void;
  className?: string;
}

export const UnifiedAgentDisplay: React.FC<UnifiedAgentDisplayProps> = ({
  agents,
  messages,
  executions,
  onAgentSelect,
  onMessageSelect,
  className
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  
  // 按Agent分组消息
  const messagesByAgent = useMemo(() => {
    const grouped: Record<string, AgentMessage[]> = {};
    messages.forEach(message => {
      if (message.agent_id) {
        if (!grouped[message.agent_id]) {
          grouped[message.agent_id] = [];
        }
        grouped[message.agent_id].push(message);
      }
    });
    return grouped;
  }, [messages]);
  
  // 按Agent分组执行记录
  const executionsByAgent = useMemo(() => {
    const grouped: Record<string, AgentExecution[]> = {};
    executions.forEach(execution => {
      if (!grouped[execution.agent_id]) {
        grouped[execution.agent_id] = [];
      }
      grouped[execution.agent_id].push(execution);
    });
    return grouped;
  }, [executions]);
  
  const handleAgentSelect = (agent: AgentInfo) => {
    setSelectedAgent(agent.id);
    onAgentSelect?.(agent);
  };
  
  const toggleDetails = (agentId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Agent列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentInfoCard
            key={agent.id}
            agent={agent}
            isActive={selectedAgent === agent.id}
            showDetails={showDetails[agent.id]}
            onToggleDetails={() => toggleDetails(agent.id)}
            onClick={() => handleAgentSelect(agent)}
          />
        ))}
      </div>
      
      {/* 选中的Agent详情 */}
      {selectedAgent && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Agent详情</h3>
          
          {/* 执行记录 */}
          {executionsByAgent[selectedAgent] && (
            <div className="space-y-2">
              <h4 className="text-md font-medium">执行记录</h4>
              {executionsByAgent[selectedAgent].map(execution => (
                <AgentExecutionProgress
                  key={execution.id}
                  execution={execution}
                />
              ))}
            </div>
          )}
          
          {/* 消息记录 */}
          {messagesByAgent[selectedAgent] && (
            <div className="space-y-2">
              <h4 className="text-md font-medium">消息记录</h4>
              {messagesByAgent[selectedAgent].map(message => (
                <AgentMessageDisplay
                  key={message.id}
                  message={message}
                  onClick={() => onMessageSelect?.(message)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedAgentDisplay;
