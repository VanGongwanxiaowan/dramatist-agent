/**
 * 智能体流式消息组件
 * 展示智能体的思考过程和输出结果
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Brain, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/loading-spinner';

// 智能体消息类型
export interface AgentStreamMessage {
  id: string;
  agentId: string;
  agentName: string;
  contentType: 'thought' | 'action' | 'result' | 'complete' | 'error';
  content: string;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    confidence?: number;
    [key: string]: any;
  };
  isStreaming?: boolean;
}

interface AgentStreamMessageProps {
  message: AgentStreamMessage;
  showAgentInfo?: boolean;
  showMetadata?: boolean;
  className?: string;
}

const AgentStreamMessage: React.FC<AgentStreamMessageProps> = ({
  message,
  showAgentInfo = true,
  showMetadata = true,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 打字机效果
  useEffect(() => {
    if (message.isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [message.content, message.isStreaming]);

  // 复制内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // 下载内容
  const handleDownload = () => {
    const blob = new Blob([message.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${message.agentName}-${message.contentType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 获取内容类型图标和颜色
  const getContentTypeInfo = (type: string) => {
    switch (type) {
      case 'thought':
        return {
          icon: Brain,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: '思考过程',
          gradient: 'from-blue-500 to-cyan-500'
        };
      case 'action':
        return {
          icon: Zap,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: '执行动作',
          gradient: 'from-yellow-500 to-orange-500'
        };
      case 'result':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '执行结果',
          gradient: 'from-green-500 to-emerald-500'
        };
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: '任务完成',
          gradient: 'from-green-500 to-emerald-500'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: '错误信息',
          gradient: 'from-red-500 to-pink-500'
        };
      default:
        return {
          icon: Bot,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: '消息',
          gradient: 'from-gray-500 to-gray-600'
        };
    }
  };

  const typeInfo = getContentTypeInfo(message.contentType);
  const Icon = typeInfo.icon;

  return (
    <Card 
      className={cn(
        "glass-card border-border/50 shadow-sm transition-all duration-300",
        "hover:shadow-card hover:border-primary/20",
        message.isStreaming && "ring-2 ring-primary/20 animate-pulse-soft",
        className
      )}
    >
      <CardContent className="p-4">
        {/* 智能体信息头部 */}
        {showAgentInfo && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
              `bg-gradient-to-r ${typeInfo.gradient}`
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{message.agentName}</span>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs px-2 py-1", typeInfo.bgColor, typeInfo.color)}
                >
                  {typeInfo.label}
                </Badge>
                {message.isStreaming && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    流式输出中...
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="w-8 h-8 p-0 hover:bg-primary/10"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="w-8 h-8 p-0 hover:bg-primary/10"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 p-0 hover:bg-primary/10"
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        )}

        {/* 消息内容 */}
        <div className="space-y-3">
          <div 
            ref={contentRef}
            className={cn(
              "prose prose-sm max-w-none",
              "text-foreground leading-relaxed",
              message.isStreaming && "animate-pulse"
            )}
          >
            {message.contentType === 'thought' ? (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">思考过程</span>
                </div>
                <div className="text-sm text-blue-700 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : message.contentType === 'action' ? (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">执行动作</span>
                </div>
                <div className="text-sm text-yellow-700 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : message.contentType === 'result' ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">执行结果</span>
                </div>
                <div className="text-sm text-green-700 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : message.contentType === 'error' ? (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">错误信息</span>
                </div>
                <div className="text-sm text-red-700 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>

          {/* 流式输出指示器 */}
          {message.isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" variant="primary" />
              <span>智能体正在思考...</span>
            </div>
          )}

          {/* 元数据信息 */}
          {showMetadata && message.metadata && isExpanded && (
            <div className="pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {message.metadata.tokensUsed && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token使用:</span>
                    <Badge variant="outline" className="text-xs">
                      {message.metadata.tokensUsed}
                    </Badge>
                  </div>
                )}
                {message.metadata.processingTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">处理时间:</span>
                    <Badge variant="outline" className="text-xs">
                      {message.metadata.processingTime}ms
                    </Badge>
                  </div>
                )}
                {message.metadata.confidence && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">置信度:</span>
                    <Badge variant="outline" className="text-xs">
                      {(message.metadata.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentStreamMessage;