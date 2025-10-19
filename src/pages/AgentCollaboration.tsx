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
  BookOpen
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 会话控制 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  智能体协作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="session-title">会话标题</Label>
                  <Input
                    id="session-title"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="输入会话标题..."
                  />
                </div>

                <div>
                  <Label>选择智能体</Label>
                  <div className="space-y-2 mt-2">
                    {selectedAgents.map(agentId => {
                      const agent = AVAILABLE_AGENTS.find(a => a.id === agentId);
                      return agent ? (
                        <div key={agentId} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white", agent.color)}>
                              {agent.icon}
                            </div>
                            <span className="text-sm font-medium">{agent.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAgent(agentId)}
                          >
                            ×
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  <Dialog open={showAgentSelector} onOpenChange={setShowAgentSelector}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Plus className="w-4 h-4 mr-2" />
                        添加智能体
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>选择智能体</DialogTitle>
                        <DialogDescription>
                          选择要参与协作的智能体
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        {AVAILABLE_AGENTS.map(agent => (
                          <div
                            key={agent.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedAgents.includes(agent.id) 
                                ? "bg-blue-50 border-blue-200" 
                                : "hover:bg-gray-50"
                            )}
                            onClick={() => {
                              addAgent(agent.id);
                              setShowAgentSelector(false);
                            }}
                          >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", agent.color)}>
                              {agent.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-sm text-gray-500">{agent.description}</div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {agent.category}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleStartSession}
                    disabled={selectedAgents.length === 0 || isConnected}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    启动协作
                  </Button>
                  
                  {session && (
                    <Button
                      onClick={handleStopSession}
                      variant="outline"
                      className="w-full"
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">会话统计</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>消息数量:</span>
                    <span>{stats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>完成智能体:</span>
                    <span>{stats.completedAgents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token使用:</span>
                    <span>{stats.totalTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>运行时间:</span>
                    <span>{Math.round(stats.duration / 1000)}s</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 错误信息 */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="text-red-600 text-sm">
                    <strong>错误:</strong> {error}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧流式展示区域 */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>智能体协作过程</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {connectionStatus === 'connected' && '🟢 已连接'}
                        {connectionStatus === 'connecting' && '🟡 连接中'}
                        {connectionStatus === 'disconnected' && '⚫ 未连接'}
                        {connectionStatus === 'error' && '🔴 错误'}
                      </Badge>
                      {session && (
                        <span className="text-sm text-gray-500">
                          {session.agents.length} 个智能体参与
                        </span>
                      )}
                    </div>
                  </div>
                  {session && (
                    <Button
                      onClick={handleRestartSession}
                      variant="outline"
                      size="sm"
                    >
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
                  <div className="flex items-center justify-center h-[600px] text-gray-500">
                    <div className="text-center">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">准备开始智能体协作</h3>
                      <p className="text-sm">选择智能体并启动协作会话</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 消息输入区域 */}
            {session && session.status === 'running' && (
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <Label htmlFor="user-message">发送消息给智能体</Label>
                    <Textarea
                      id="user-message"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="输入您的消息..."
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userMessage.trim()}
                      >
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
