/**
 * 智能体流式消息组件
 * 展示各个智能体的实时输出，包括智能体名称、状态和内容
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { cn } from "@/lib/utils";
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
  BookOpen
} from "lucide-react";

// 智能体类型定义
export interface JubenAgent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'creation' | 'analysis' | 'plot' | 'character' | 'evaluation' | 'workflow';
  status: 'idle' | 'thinking' | 'working' | 'completed' | 'error';
  icon?: React.ReactNode;
  color?: string;
}

// 流式消息类型
export interface AgentStreamMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  content: string;
  contentType: 'thought' | 'action' | 'result' | 'error' | 'complete';
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    duration?: number;
    toolsUsed?: string[];
    confidence?: number;
  };
  isStreaming?: boolean;
  isComplete?: boolean;
}

// 智能体配置
const AGENT_CONFIG: Record<string, JubenAgent> = {
  'planner': {
    id: 'planner',
    name: 'planner',
    displayName: '短剧策划智能体',
    description: '负责短剧的整体策划和创意构思',
    category: 'creation',
    status: 'idle',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'bg-blue-500'
  },
  'creator': {
    id: 'creator',
    name: 'creator',
    displayName: '短剧创作智能体',
    description: '负责具体的剧本创作和内容生成',
    category: 'creation',
    status: 'idle',
    icon: <PenTool className="w-4 h-4" />,
    color: 'bg-green-500'
  },
  'evaluation': {
    id: 'evaluation',
    name: 'evaluation',
    displayName: '剧本评估智能体',
    description: '负责剧本质量评估和改进建议',
    category: 'evaluation',
    status: 'idle',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'bg-purple-500'
  },
  'story-analysis': {
    id: 'story-analysis',
    name: 'story-analysis',
    displayName: '故事五元素分析',
    description: '分析故事的五元素结构',
    category: 'analysis',
    status: 'idle',
    icon: <Brain className="w-4 h-4" />,
    color: 'bg-orange-500'
  },
  'character-profile-generator': {
    id: 'character-profile-generator',
    name: 'character-profile-generator',
    displayName: '角色档案生成器',
    description: '生成详细的角色档案和背景故事',
    category: 'character',
    status: 'idle',
    icon: <Users className="w-4 h-4" />,
    color: 'bg-pink-500'
  },
  'plot-points-workflow': {
    id: 'plot-points-workflow',
    name: 'plot-points-workflow',
    displayName: '大情节点工作流',
    description: '生成大情节点和详细情节点',
    category: 'plot',
    status: 'idle',
    icon: <Film className="w-4 h-4" />,
    color: 'bg-red-500'
  },
  'drama-workflow': {
    id: 'drama-workflow',
    name: 'drama-workflow',
    displayName: '戏剧工作流',
    description: '完整的戏剧创作工作流',
    category: 'workflow',
    status: 'idle',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'bg-indigo-500'
  }
};

// 获取智能体配置
export const getAgentConfig = (agentId: string): JubenAgent => {
  return AGENT_CONFIG[agentId] || {
    id: agentId,
    name: agentId,
    displayName: agentId,
    description: '未知智能体',
    category: 'creation',
    status: 'idle',
    icon: <Bot className="w-4 h-4" />,
    color: 'bg-gray-500'
  };
};

// 获取状态图标
const getStatusIcon = (status: JubenAgent['status']) => {
  switch (status) {
    case 'thinking':
    case 'working':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

// 获取内容类型样式
const getContentTypeStyle = (contentType: AgentStreamMessage['contentType']) => {
  switch (contentType) {
    case 'thought':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'action':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'result':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'complete':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

interface AgentStreamMessageProps {
  message: AgentStreamMessage;
  showAgentInfo?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export const AgentStreamMessage: React.FC<AgentStreamMessageProps> = ({
  message,
  showAgentInfo = true,
  showMetadata = true,
  className
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const agentConfig = getAgentConfig(message.agentId);

  // 流式内容展示效果
  useEffect(() => {
    if (message.isStreaming && message.content) {
      setDisplayContent('');
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < message.content.length) {
          setDisplayContent(message.content.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 20); // 每20ms添加一个字符

      return () => clearInterval(interval);
    } else {
      setDisplayContent(message.content);
    }
  }, [message.content, message.isStreaming]);

  return (
    <Card className={cn("w-full transition-all duration-300", className)}>
      <CardContent className="p-4">
        {showAgentInfo && (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={cn("text-white", agentConfig.color)}>
                {agentConfig.icon}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{agentConfig.displayName}</h4>
                {getStatusIcon(agentConfig.status)}
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                >
                  {agentConfig.category}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">{agentConfig.description}</p>
            </div>

            <div className="text-xs text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        <div className={cn(
          "rounded-lg p-3 border-l-4",
          getContentTypeStyle(message.contentType)
        )}>
          {message.isStreaming && message.contentType !== 'complete' ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {message.contentType === 'thought' && '💭 思考中...'}
                {message.contentType === 'action' && '⚡ 执行中...'}
                {message.contentType === 'result' && '📊 分析中...'}
                {message.contentType === 'error' && '❌ 错误'}
              </div>
              <TextShimmer>
                {displayContent || '正在生成内容...'}
              </TextShimmer>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap">
              {displayContent}
            </div>
          )}
        </div>

        {showMetadata && message.metadata && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {message.metadata.tokensUsed && (
                <span>Tokens: {message.metadata.tokensUsed}</span>
              )}
              {message.metadata.duration && (
                <span>耗时: {message.metadata.duration}ms</span>
              )}
              {message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                <span>工具: {message.metadata.toolsUsed.join(', ')}</span>
              )}
              {message.metadata.confidence && (
                <span>置信度: {(message.metadata.confidence * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentStreamMessage;
