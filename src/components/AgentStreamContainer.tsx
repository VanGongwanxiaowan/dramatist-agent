/**
 * 智能体流式展示容器组件
 * 管理多个智能体的流式输出展示
 */

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bot, 
  Play, 
  Square, 
  RotateCcw, 
  Filter,
  Eye,
  EyeOff,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AgentStreamMessage, AgentStreamMessageProps } from "./AgentStreamMessage";

// 流式会话状态
export interface StreamSession {
  id: string;
  sessionId: string;
  projectId: string;
  title: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  agents: string[];
  messages: AgentStreamMessage[];
  startTime: string;
  endTime?: string;
  totalTokens?: number;
  totalCost?: number;
}

// 过滤器类型
export interface StreamFilter {
  agentIds?: string[];
  contentTypes?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  showCompleted?: boolean;
  showErrors?: boolean;
}

interface AgentStreamContainerProps {
  session: StreamSession;
  onSessionUpdate?: (session: StreamSession) => void;
  onAgentStart?: (agentId: string) => void;
  onAgentStop?: (agentId: string) => void;
  onSessionRestart?: () => void;
  className?: string;
}

export const AgentStreamContainer: React.FC<AgentStreamContainerProps> = ({
  session,
  onSessionUpdate,
  onAgentStart,
  onAgentStop,
  onSessionRestart,
  className
}) => {
  const [filter, setFilter] = useState<StreamFilter>({
    showCompleted: true,
    showErrors: true
  });
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [showMetadata, setShowMetadata] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages]);

  // 过滤消息
  const filteredMessages = session.messages.filter(message => {
    if (filter.agentIds && !filter.agentIds.includes(message.agentId)) {
      return false;
    }
    if (filter.contentTypes && !filter.contentTypes.includes(message.contentType)) {
      return false;
    }
    if (!filter.showCompleted && message.contentType === 'complete') {
      return false;
    }
    if (!filter.showErrors && message.contentType === 'error') {
      return false;
    }
    return true;
  });

  // 按智能体分组消息
  const messagesByAgent = filteredMessages.reduce((acc, message) => {
    if (!acc[message.agentId]) {
      acc[message.agentId] = [];
    }
    acc[message.agentId].push(message);
    return acc;
  }, {} as Record<string, AgentStreamMessage[]>);

  // 获取活跃的智能体
  const activeAgents = session.agents.filter(agentId => {
    const agentMessages = messagesByAgent[agentId];
    return agentMessages && agentMessages.some(msg => 
      msg.contentType === 'thought' || 
      msg.contentType === 'action' || 
      msg.contentType === 'result'
    );
  });

  // 获取会话统计信息
  const getSessionStats = () => {
    const totalMessages = session.messages.length;
    const completedAgents = session.messages.filter(msg => msg.contentType === 'complete').length;
    const errorCount = session.messages.filter(msg => msg.contentType === 'error').length;
    const totalTokens = session.messages.reduce((sum, msg) => 
      sum + (msg.metadata?.tokensUsed || 0), 0
    );

    return {
      totalMessages,
      completedAgents,
      errorCount,
      totalTokens
    };
  };

  const stats = getSessionStats();

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 会话头部 */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">{session.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={session.status === 'running' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {session.status === 'running' && '🟢 运行中'}
                  {session.status === 'completed' && '✅ 已完成'}
                  {session.status === 'error' && '❌ 错误'}
                  {session.status === 'idle' && '⏸️ 空闲'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {activeAgents.length} / {session.agents.length} 智能体活跃
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 控制按钮 */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMetadata(!showMetadata)}
            >
              {showMetadata ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSessionRestart}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重启会话
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter({ showCompleted: true, showErrors: true })}>
                  <Filter className="w-4 h-4 mr-2" />
                  重置过滤器
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // 清空消息
                  onSessionUpdate && onSessionUpdate({ ...session, messages: [] });
                }}>
                  清空消息
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // 导出为JSON
                  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${session.title || 'agent-session'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  导出JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // 仅导出可读 Markdown（简单拼接）
                  const md = session.messages.map(m => `### [${m.agentName}] ${m.contentType}\n\n${m.content}`).join('\n\n---\n\n');
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${session.title || 'agent-session'}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  导出Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>消息: {stats.totalMessages}</span>
          <span>完成: {stats.completedAgents}</span>
          {stats.errorCount > 0 && <span className="text-red-500">错误: {stats.errorCount}</span>}
          {stats.totalTokens > 0 && <span>Tokens: {stats.totalTokens}</span>}
          <span>开始时间: {new Date(session.startTime).toLocaleTimeString()}</span>
        </div>
      </CardHeader>

      {/* 消息展示区域 */}
      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-4">
          <div className="space-y-4 pb-4">
            {Object.entries(messagesByAgent).map(([agentId, messages]) => (
              <div key={agentId} className="space-y-2">
                {messages.map((message, index) => (
                  <AgentStreamMessage
                    key={`${message.id}-${index}`}
                    message={message}
                    showAgentInfo={index === 0 || expandedAgents.has(agentId)}
                    showMetadata={showMetadata}
                    className={cn(
                      "transition-all duration-300",
                      message.isStreaming && "ring-2 ring-blue-200 animate-pulse"
                    )}
                  />
                ))}
              </div>
            ))}
            
            {filteredMessages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无消息</p>
                <p className="text-sm">智能体将在这里显示它们的思考过程和输出结果</p>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      {/* 底部操作栏 */}
      {session.status === 'running' && (
        <div className="border-t p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              智能体正在工作中...
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAgentStop && onAgentStop('all')}
            >
              <Square className="w-4 h-4 mr-2" />
              停止所有
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentStreamContainer;
