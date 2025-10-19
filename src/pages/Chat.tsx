import { useState } from "react";
import { MessageSquare, Plus, Trash2, X, Menu, Send } from "lucide-react";
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
  { value: "orchestrator", label: "JubenOrchestrator - 主编排器" },
  { value: "concierge", label: "JubenConcierge - 门面智能体" },
  { value: "short-drama-planner", label: "短剧策划智能体" },
  { value: "short-drama-creator", label: "短剧创作智能体" },
  { value: "story-five-elements", label: "故事五元素分析" },
  { value: "character-profile", label: "角色设定智能体" },
  { value: "ip-evaluation", label: "IP初筛评估" },
  { value: "script-evaluation", label: "剧本评估智能体" },
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
  const [selectedAgent, setSelectedAgent] = useState("orchestrator");
  const [markdown, setMarkdown] = useState("");

  const currentConv = conversations.find((c) => c.id === currentConvId);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConvId
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      )
    );

    // 模拟AI回复
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "这是一个示例回复。实际应用中，这里会连接到真实的AI服务。",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConvId
            ? { ...conv, messages: [...conv.messages, aiMessage] }
            : conv
        )
      );

      setMarkdown(`# 分析结果\n\n这是右侧Markdown渲染的示例内容。\n\n## 故事五元素\n\n1. **题材类型**: 都市情感\n2. **故事梗概**: ...\n3. **人物小传**: ...\n`);
    }, 1000);

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

          <ScrollArea className="flex-1 p-4">
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
                    <p className="text-sm">{message.content}</p>
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
              />
              <Button onClick={handleSend} className="gradient-primary text-white shadow-glow">
                <Send className="h-4 w-4" />
              </Button>
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
