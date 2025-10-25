/**
 * 智能体协作页面
 * 展示多个智能体协作完成任务的流式过程
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Bot, 
  Play, 
  Square, 
  Plus, 
  Settings,
  Users,
  Brain,
  PenTool,
  BarChart3,
  Lightbulb,
  Film,
  BookOpen,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import Header from '@/components/Header';
import AgentStreamContainer from '@/components/AgentStreamContainer';
import { useAgentStreaming } from '@/hooks/useAgentStreaming';
import { agentStreamingApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// 智能体配置
const AVAILABLE_AGENTS = [
  {
    id: 'planner',
    name: '短剧策划智能体',
    description: '负责短剧的整体策划和创意构思',
    category: '创作核心',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'bg-blue-500'
  },
  {
    id: 'creator',
    name: '短剧创作智能体',
    description: '负责具体的剧本创作和内容生成',
    category: '创作核心',
    icon: <PenTool className="w-4 h-4" />,
    color: 'bg-green-500'
  },
  {
    id: 'evaluation',
    name: '剧本评估智能体',
    description: '负责剧本质量评估和改进建议',
    category: '创作核心',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'bg-purple-500'
  },
  {
    id: 'story-analysis',
    name: '故事五元素分析',
    description: '分析故事的五元素结构',
    category: '分析工具',
    icon: <Brain className="w-4 h-4" />,
    color: 'bg-orange-500'
  },
  {
    id: 'character-profile-generator',
    name: '角色档案生成器',
    description: '生成详细的角色档案和背景故事',
    category: '分析工具',
    icon: <Users className="w-4 h-4" />,
    color: 'bg-pink-500'
  },
  {
    id: 'plot-points-workflow',
    name: '大情节点工作流',
    description: '生成大情节点和详细情节点',
    category: '情节点',
    icon: <Film className="w-4 h-4" />,
    color: 'bg-red-500'
  },
  {
    id: 'drama-workflow',
    name: '戏剧工作流',
    description: '完整的戏剧创作工作流',
    category: '工作流',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'bg-indigo-500'
  }
];

const AgentCollaboration: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const {
    session,
    isConnected,
    connectionStatus,
    error,
    startSession,
    stopSession,
    sendMessage,
    getStats
  } = useAgentStreaming({
    onSessionStart: (session) => {
      console.log('Session started:', session);
    },
    onSessionComplete: (session) => {
      console.log('Session completed:', session);
    },
    onError: (error) => {
      console.error('Streaming error:', error);
    }
  });

  // 添加智能体到选择列表
  const addAgent = (agentId: string) => {
    if (!selectedAgents.includes(agentId)) {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  // 移除智能体
  const removeAgent = (agentId: string) => {
    setSelectedAgents(selectedAgents.filter(id => id !== agentId));
  };

  // 启动协作会话
  const handleStartSession = async () => {
    if (!projectId || selectedAgents.length === 0) {
      alert('请选择项目并至少选择一个智能体');
      return;
    }

    try {
      await startSession(projectId, selectedAgents, sessionTitle);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // 停止会话
  const handleStopSession = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!userMessage.trim() || !session) return;

    try {
      await sendMessage(userMessage);
      setUserMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // 重启会话
  const handleRestartSession = async () => {
    if (session) {
      await handleStopSession();
      setTimeout(() => {
        handleStartSession();
      }, 1000);
    }
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 会话控制 */}
            <Card className="glass-card border-border/50 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gradient">智能体协作</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-title" className="text-sm font-medium">会话标题</Label>
                  <Input
                    id="session-title"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="输入会话标题..."
                    className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">选择智能体</Label>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedAgents.map(agentId => {
                      const agent = AVAILABLE_AGENTS.find(a => a.id === agentId);
                      return agent ? (
                        <div key={agentId} className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20 group hover:border-primary/40 transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm", agent.color)}>
                              {agent.icon}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors">{agent.name}</span>
                              <p className="text-xs text-muted-foreground">{agent.description}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAgent(agentId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive/10 hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  <Dialog open={showAgentSelector} onOpenChange={setShowAgentSelector}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gradient-button border-primary/20 hover:border-primary/40 text-primary hover:text-white transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加智能体
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gradient">选择智能体</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          选择要参与协作的智能体，每个智能体都有独特的专业能力
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
                        {AVAILABLE_AGENTS.map(agent => (
                          <div
                            key={agent.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 group",
                              selectedAgents.includes(agent.id) 
                                ? "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/40 shadow-sm" 
                                : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 hover:border-primary/20 hover:shadow-sm"
                            )}
                            onClick={() => {
                              addAgent(agent.id);
                              setShowAgentSelector(false);
                            }}
                          >
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110", agent.color)}>
                              {agent.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-primary group-hover:text-accent transition-colors">{agent.name}</div>
                              <div className="text-sm text-muted-foreground leading-relaxed">{agent.description}</div>
                              <Badge variant="secondary" className="text-xs mt-2">
                                {agent.category}
                              </Badge>
                            </div>
                            {selectedAgents.includes(agent.id) && (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleStartSession}
                    disabled={selectedAgents.length === 0 || isConnected}
                    className="w-full h-12 gradient-button text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    启动协作
                  </Button>
                  
                  {session && (
                    <Button
                      onClick={handleStopSession}
                      variant="outline"
                      className="w-full h-12 border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-all duration-300"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      停止协作
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 会话统计 */}
            {stats && (
              <Card className="glass-card border-border/50 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gradient">会话统计</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.totalMessages}</div>
                      <div className="text-xs text-muted-foreground">消息数量</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.completedAgents}</div>
                      <div className="text-xs text-muted-foreground">完成智能体</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Token使用:</span>
                      <Badge variant="secondary" className="text-xs">{stats.totalTokens}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">运行时间:</span>
                      <Badge variant="outline" className="text-xs">{Math.round(stats.duration / 1000)}s</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 错误信息 */}
            {error && (
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium">连接错误</span>
                  </div>
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧流式展示区域 */}
          <div className="lg:col-span-3">
            <Card className="h-full glass-card border-border/50 shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gradient">智能体协作过程</CardTitle>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge 
                        variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs px-3 py-1",
                          connectionStatus === 'connected' && "bg-green-500 text-white animate-pulse-soft",
                          connectionStatus === 'connecting' && "bg-yellow-500 text-white animate-pulse",
                          connectionStatus === 'disconnected' && "bg-gray-500 text-white",
                          connectionStatus === 'error' && "bg-red-500 text-white animate-pulse"
                        )}
                      >
                        {connectionStatus === 'connected' && '🟢 已连接'}
                        {connectionStatus === 'connecting' && '🟡 连接中'}
                        {connectionStatus === 'disconnected' && '⚫ 未连接'}
                        {connectionStatus === 'error' && '🔴 错误'}
                      </Badge>
                      {session && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {session.agents.length} 个智能体参与
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {session && (
                    <Button
                      onClick={handleRestartSession}
                      variant="outline"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重启会话
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {session ? (
                  <AgentStreamContainer
                    session={session}
                    onSessionRestart={handleRestartSession}
                    className="h-[600px]"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                    <div className="text-center animate-fade-in">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center animate-float">
                        <Bot className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gradient">准备开始智能体协作</h3>
                      <p className="text-muted-foreground mb-6">选择智能体并启动协作会话，体验AI智能体的强大协作能力</p>
                      <div className="flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 消息输入区域 */}
            {session && session.status === 'running' && (
              <Card className="mt-6 glass-card border-border/50 shadow-card">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Label htmlFor="user-message" className="text-sm font-medium text-gradient">
                      发送消息给智能体
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="user-message"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder="输入您的消息，智能体将实时响应..."
                        rows={4}
                        className="resize-none border-2 focus:border-primary/50 transition-all duration-300"
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                        {userMessage.length}/500
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userMessage.trim()}
                        className="gradient-button text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        发送消息
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCollaboration;
