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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const agents = [
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
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "新对话",
      messages: [],
    },
  ]);
  const [currentConvId, setCurrentConvId] = useState("1");
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("planner");
  const [markdown, setMarkdown] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find((c) => c.id === currentConvId);

  // 使用流式聊天Hook
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
    },
    onComplete: (finalContent, metadata) => {
      console.log('流式聊天完成', { finalContent, metadata });
      if (metadata?.markdown) {
        setMarkdown(metadata.markdown);
      }
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
    if (!input.trim() || streamChat.isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // 添加用户消息
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConvId
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      )
    );

    // 添加空的AI消息占位符
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConvId
          ? { ...conv, messages: [...conv.messages, aiMessage] }
          : conv
      )
    );

    // 滚动到底部
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);

    try {
      // 开始流式聊天
      await streamChat.startStream(
        {
          message: input,
          agent_type: selectedAgent,
          session_id: jubenApi.getSessionId(),
          context: {
            conversation_history: currentConv?.messages.slice(-5) || [],
            agent_type: selectedAgent,
          },
        },
        selectedAgent
      );
    } catch (error) {
      console.error('发送消息失败:', error);
    }

    setInput("");
  };

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: `对话 ${conversations.length + 1}`,
      messages: [],
    };
    setConversations([...conversations, newConv]);
    setCurrentConvId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConvId === id && conversations.length > 1) {
      setCurrentConvId(conversations[0].id);
    }
  };

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
                        <span className="text-sm truncate">{conv.title}</span>
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

              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="选择Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.value} value={agent.value}>
                      {agent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
