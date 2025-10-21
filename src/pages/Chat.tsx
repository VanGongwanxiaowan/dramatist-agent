import { useState, useRef, useEffect } from "react";
import { MessageSquare, Plus, Trash2, X, Menu, Send, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import Header from "@/components/Header";
import { useStreamChat } from "@/hooks/useStreamChat";
import { jubenApi } from "@/lib/api";
import { createDatabaseAPI, Database } from "@/lib/database";
import { ConnectionStatus } from "@/components/ConnectionStatus";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agent_name?: string;
  message_metadata?: any;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  session_id: string;
  created_at: string;
  last_activity_at: string;
  status: string;
}

// 智能体列表将从后端API动态获取
const defaultAgents = [
  { value: "planner", label: "短剧策划智能体" },
  { value: "creator", label: "短剧创作智能体" },
  { value: "evaluation", label: "剧本评估智能体" },
  { value: "websearch", label: "网络搜索助手" },
  { value: "knowledge", label: "知识库查询助手" },
  { value: "file-reference", label: "文件引用解析助手" },
  { value: "story-analysis", label: "故事五元素分析" },
  { value: "series-analysis", label: "已播剧集分析" },
  { value: "plot-points-workflow", label: "大情节点工作流" },
  { value: "story-summary", label: "故事大纲生成" },
  { value: "major-plot-points", label: "大情节点分析" },
];

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string>("");
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("planner");
  const [markdown, setMarkdown] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // 智能体列表状态
  const [agents, setAgents] = useState(defaultAgents);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // 数据库API实例
  const [dbAPI, setDbAPI] = useState<any>(null);

  // 从后端获取智能体列表
  const loadAgents = async () => {
    setAgentsLoading(true);
    try {
      const response = await fetch('/agents/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 智能体API响应:', result);
      
      if (result.success && result.data && result.data.agents) {
        // 转换API返回的数据格式为前端需要的格式
        const agentsFromAPI = result.data.agents.map((agent: any) => {
          // 智能体名称映射 - 基于后端返回的name字段
          const nameMapping: { [key: string]: string } = {
            // 核心智能体
            'ShortDramaPlannerAgent': 'planner',
            'ShortDramaCreatorAgent': 'creator', 
            'ShortDramaEvaluationAgent': 'evaluation',
            
            // 工具智能体
            'WebSearchAgent': 'websearch',
            'KnowledgeAgent': 'knowledge',
            'FileReferenceAgent': 'file-reference',
            'MindMapAgent': 'mind-map',
            'OutputFormatterAgent': 'output-formatter',
            'ResultIntegratorAgent': 'result-integrator',
            'TextSplitterAgent': 'text-splitter',
            'TextTruncatorAgent': 'text-truncator',
            'DocumentGeneratorAgent': 'document-generator',
            
            // 分析工具
            'StoryAnalysisAgent': 'story-analysis',
            'StoryFiveElementsAgent': 'story-analysis',
            'DramaAnalysisAgent': 'drama-analysis',
            'SeriesAnalysisAgent': 'series-analysis',
            'ScoreAnalyzerAgent': 'score-analyzer',
            
            // 评估工具
            'StoryEvaluationAgent': 'story-evaluation',
            'IPEvaluationAgent': 'ip-evaluation',
            'ScriptEvaluationAgent': 'script-evaluation',
            'NovelScreeningEvaluationAgent': 'novel-screening-evaluation',
            'StoryOutlineEvaluationAgent': 'story-outline-evaluation',
            'TextProcessorEvaluationAgent': 'text-processor-evaluation',
            'ResultAnalyzerEvaluationAgent': 'result-analyzer-evaluation',
            
            // 角色开发
            'CharacterProfileGeneratorAgent': 'character-profile-generator',
            'CharacterRelationshipAnalyzerAgent': 'character-relationship-analyzer',
            
            // 情节点
            'MajorPlotPointsAgent': 'major-plot-points',
            'DetailedPlotPointsAgent': 'detailed-plot-points',
            'PlotPointsAnalyzerAgent': 'plot-points-analyzer',
            'PlotPointsWorkflowAgent': 'plot-points-workflow',
            
            // 故事开发
            'StorySummaryAgent': 'story-summary',
            'StorySummaryGeneratorAgent': 'story-summary-generator',
            'StoryTypeAnalyzerAgent': 'story-type-analyzer',
            
            // 工作流
            'DramaWorkflowAgent': 'drama-workflow',
            
            // 系列分析
            'SeriesInfoAgent': 'series-info',
            'SeriesNameExtractorAgent': 'series-name-extractor',
          };
          
          const value = nameMapping[agent.name] || agent.name.toLowerCase().replace('agent', '');
          const label = agent.description.split(' - ')[0] || agent.name;
          
          return { value, label };
        });
        
        setAgents(agentsFromAPI);
        console.log('✅ 成功加载智能体:', agentsFromAPI.length, '个');
        console.log('📋 智能体列表:', agentsFromAPI.map(a => a.label));
      } else {
        console.error('❌ API返回数据格式错误:', result);
        // 如果API失败，使用默认智能体列表
        setAgents(defaultAgents);
      }
    } catch (error) {
      console.error('❌ 获取智能体列表失败:', error);
      // 如果API失败，使用默认智能体列表
      setAgents(defaultAgents);
    } finally {
      setAgentsLoading(false);
    }
  };

  // 保存AI最终消息内容到数据库并同步到本地状态
  const saveAIMessage = async (finalContent: string, metadata: any) => {
    try {
      if (!dbAPI || !currentConv) return;
      // AI消息是列表中的最后一条占位符
      const aiMsg = currentConv.messages[currentConv.messages.length - 1];
      if (!aiMsg || aiMsg.role !== 'assistant') return;
      const updated = await dbAPI.updateChatMessage(aiMsg.id, {
        content: finalContent,
        message_metadata: metadata || {},
        is_edited: false,
      });
      setConversations(prev => prev.map(conv =>
        conv.id === currentConvId
          ? {
              ...conv,
              messages: conv.messages.map(m => m.id === aiMsg.id ? { ...m, content: updated.content, message_metadata: updated.message_metadata } : m)
            }
          : conv
      ));
    } catch (e) {
      console.error('保存AI消息失败:', e);
    }
  };

  const currentConv = conversations.find((c) => c.id === currentConvId);

  // 初始化数据库连接
  useEffect(() => {
    const initDatabase = async () => {
      try {
        // 使用固定的用户ID，实际应用中应该从认证系统获取
        const userId = "demo_user_001";
        const databaseAPI = createDatabaseAPI(userId);
        setDbAPI(databaseAPI);

        // 加载用户会话
        const sessions = await databaseAPI.getUserSessions();
        const conversationsList: Conversation[] = sessions.map(session => ({
          id: session.session_id,
          title: session.metadata?.title || `对话 ${session.session_id.slice(-8)}`,
          messages: [],
          session_id: session.session_id,
          created_at: session.created_at,
          last_activity_at: session.last_activity_at,
          status: session.status,
        }));

        setConversations(conversationsList);

        // 如果有会话，选择第一个并加载消息
        if (conversationsList.length > 0) {
          setCurrentConvId(conversationsList[0].id);
          await loadMessages(conversationsList[0].session_id, databaseAPI);
        }
      } catch (error) {
        console.error('初始化数据库失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initDatabase();
  }, []);

  // 加载智能体列表
  useEffect(() => {
    loadAgents();
  }, []);

  // 加载消息
  const loadMessages = async (sessionId: string, api: any) => {
    try {
      const messages = await api.getChatMessages(sessionId);
      const formattedMessages: Message[] = messages.map((msg: any) => ({
        id: msg.id,
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        agent_name: msg.agent_name,
        message_metadata: msg.message_metadata,
      }));

      setConversations(prev => 
        prev.map(conv => 
          conv.session_id === sessionId 
            ? { ...conv, messages: formattedMessages }
            : conv
        )
      );
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  // 使用流式聊天Hook（统一一个实例，负责消息与Markdown、滚动与持久化）
  const streamChat = useStreamChat({
    onStart: () => {
      console.log('开始流式聊天');
    },
    onUpdate: (content, metadata) => {
      // 更新当前消息内容
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConvId 
            ? {
                ...conv,
                messages: conv.messages.map((msg, index) => 
                  index === conv.messages.length - 1 && msg.role === 'assistant'
                    ? { ...msg, content }
                    : msg
                )
              }
            : conv
        )
      );
      
      // 更新Markdown内容
      if (metadata?.markdown) {
        setMarkdown(metadata.markdown);
      } else if (content) {
        setMarkdown(content);
      }
      // 实时滚动到底部
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    },
    onComplete: (finalContent, metadata) => {
      console.log('流式聊天完成', { finalContent, metadata });
      if (metadata?.markdown) {
        setMarkdown(metadata.markdown);
      }
      // 持久化最终AI消息
      saveAIMessage(finalContent, metadata);
    },
    onError: (error) => {
      console.error('流式聊天错误:', error);
      // 添加错误消息
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `错误: ${error}`,
        timestamp: new Date(),
      };
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConvId 
            ? { ...conv, messages: [...conv.messages, errorMessage] }
            : conv
        )
      );
    },
  });

  const handleSend = async () => {
    if (!input.trim() || streamChat.isStreaming || !dbAPI || !currentConv) return;

    try {
      // 保存用户消息到数据库
      const userMessage = await dbAPI.createChatMessage({
        session_id: currentConv.session_id,
        message_type: 'user',
        content: input,
        message_order: currentConv.messages.length,
      });

      // 更新本地状态
      const userMsg: Message = {
        id: userMessage.id,
        role: "user",
        content: input,
        timestamp: new Date(userMessage.created_at),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConvId
            ? { ...conv, messages: [...conv.messages, userMsg] }
            : conv
        )
      );

      // 创建AI消息占位符
      const aiMessagePlaceholder = await dbAPI.createChatMessage({
        session_id: currentConv.session_id,
        message_type: 'assistant',
        content: '',
        agent_name: selectedAgent,
        message_order: currentConv.messages.length + 1,
      });

      const aiMsg: Message = {
        id: aiMessagePlaceholder.id,
        role: "assistant",
        content: "",
        timestamp: new Date(aiMessagePlaceholder.created_at),
        agent_name: selectedAgent,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConvId
            ? { ...conv, messages: [...conv.messages, aiMsg] }
            : conv
        )
      );

      // 滚动到底部
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);

      // 清空输入框和之前的回复内容
      const userInput = input;
      setInput("");
      setMarkdown(""); // 清空之前的回复内容

      // 开始增强的流式聊天
      await streamChat.startStream(
        {
          message: userInput,
          agent_type: selectedAgent,
          session_id: currentConv.session_id,
          user_id: "demo_user_001",
          context: {
            conversation_history: currentConv.messages.slice(-5) || [],
            agent_type: selectedAgent,
          },
        },
        selectedAgent
      );
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const createNewConversation = async () => {
    if (!dbAPI) return;

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建新的会话到数据库
      const newSession = await dbAPI.createUserSession({
        session_id: sessionId,
        metadata: {
          title: `新对话 ${conversations.length + 1}`,
          created_by: 'user',
        },
        preferences: {},
        usage_stats: {},
      });

      const newConv: Conversation = {
        id: sessionId,
        title: newSession.metadata?.title || `对话 ${conversations.length + 1}`,
        messages: [],
        session_id: sessionId,
        created_at: newSession.created_at,
        last_activity_at: newSession.last_activity_at,
        status: newSession.status,
      };

      setConversations(prev => [newConv, ...prev]);
      setCurrentConvId(sessionId);
    } catch (error) {
      console.error('创建新对话失败:', error);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!dbAPI) return;

    try {
      // 从数据库删除会话
      await dbAPI.deleteUserSession(id);
      
      // 更新本地状态
      setConversations((prev) => prev.filter((c) => c.id !== id));
      
      if (currentConvId === id && conversations.length > 1) {
        const remaining = conversations.filter(c => c.id !== id);
        setCurrentConvId(remaining[0].id);
      } else if (conversations.length === 1) {
        setCurrentConvId("");
      }
    } catch (error) {
      console.error('删除对话失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载对话数据中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧对话管理 */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 border-r border-border bg-card overflow-hidden`}
        >
          <div className="flex h-full flex-col p-4">
            <Button
              onClick={createNewConversation}
              className="w-full mb-4 gradient-primary text-white shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建对话
            </Button>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-all hover:bg-accent/10 ${
                      currentConvId === conv.id
                        ? "bg-primary/10 border border-primary/30"
                        : ""
                    }`}
                    onClick={() => setCurrentConvId(conv.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        {editingTitleId === conv.id ? (
                          <input
                            className="text-sm bg-transparent border-b border-border outline-none w-full"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={async () => {
                              if (!dbAPI) return;
                              try {
                                await dbAPI.updateUserSession(conv.id, { metadata: { ...(conv as any).metadata, title: editingTitle } });
                                setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: editingTitle } : c));
                              } catch (e) {}
                              setEditingTitleId(null);
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm truncate" onDoubleClick={() => { setEditingTitleId(conv.id); setEditingTitle(conv.title); }}>{conv.title}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                disabled={!currentConv}
                onClick={async () => {
                  if (!currentConv) return;
                  if (!dbAPI) return;
                  try {
                    await dbAPI.clearChatMessages(currentConv.session_id);
                    setConversations(prev => prev.map(c => c.id === currentConv.id ? { ...c, messages: [] } : c));
                  } catch (e) {}
                }}
              >清空当前会话
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={!currentConv}
                onClick={() => {
                  if (!currentConv) return;
                  const blob = new Blob([JSON.stringify(currentConv, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentConv.title || 'conversation'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >导出会话JSON
              </Button>
            </div>
          </div>
        </div>

        {/* 中间聊天区域 */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-border p-4 bg-card/50 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-4">
                <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={agentsLoading}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder={agentsLoading ? "加载智能体中..." : "选择Agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.value} value={agent.value}>
                        {agent.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* 连接状态显示 */}
                <ConnectionStatus
                  connectionStatus={streamChat.connectionStatus}
                  heartbeatStatus={streamChat.heartbeatStatus}
                  lastHeartbeat={streamChat.lastHeartbeat}
                  reconnectAttempts={streamChat.reconnectAttempts}
                  maxReconnectAttempts={3}
                  onRetry={() => {
                    console.log('手动重试连接');
                    // 这里可以添加重试逻辑
                  }}
                />
              </div>
            </div>
          </div>

          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {currentConv?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "gradient-primary text-white shadow-glow"
                        : "bg-card border border-border"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                        {streamChat.isStreaming && message.id === currentConv?.messages[currentConv.messages.length - 1]?.id && (
                          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs">正在思考...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-4 bg-card/50 backdrop-blur">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="输入您的问题..."
                className="flex-1"
                disabled={streamChat.isStreaming}
              />
              {streamChat.isStreaming ? (
                <Button 
                  onClick={streamChat.stopStream} 
                  variant="destructive"
                  className="shadow-glow"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSend} 
                  className="gradient-primary text-white shadow-glow"
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧Markdown渲染 */}
        <div className="w-96 border-l border-border bg-card overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="border-b border-border p-4">
              <h3 className="font-semibold">分析结果</h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{markdown || "暂无内容"}</ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
