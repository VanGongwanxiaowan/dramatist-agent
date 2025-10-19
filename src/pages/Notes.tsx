import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Loader2, Archive, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useNotes } from "@/hooks/useDataStorage";
import { createDatabaseAPI } from "@/lib/database";

interface Note {
  id: string;
  action: string;
  name: string;
  title: string | null;
  context: string;
  select_status: number;
  priority: number;
  tags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用固定的用户ID，实际应用中应该从认证系统获取
  const userId = "demo_user_001";
  const sessionId = selectedSession || "default_session";
  
  // 获取用户会话列表和数据库API
  const [sessions, setSessions] = useState<any[]>([]);
  const [dbAPI, setDbAPI] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // 初始化数据库连接和会话列表
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('初始化数据库连接...', userId);
        const databaseAPI = createDatabaseAPI(userId);
        setDbAPI(databaseAPI);
        
        // 获取用户会话列表
        console.log('获取用户会话列表...');
        const userSessions = await databaseAPI.getUserSessions();
        console.log('用户会话列表:', userSessions);
        setSessions(userSessions);
        
        // 如果没有会话，创建一个默认会话
        if (userSessions.length === 0) {
          console.log('创建默认会话...');
          const defaultSession = await databaseAPI.createUserSession({
            session_id: "default_session",
            metadata: {
              title: "默认会话",
              created_by: 'user',
            },
            preferences: {},
            usage_stats: {},
          });
          console.log('默认会话创建成功:', defaultSession);
          setSessions([defaultSession]);
          setSelectedSession("default_session");
        } else if (!selectedSession) {
          setSelectedSession(userSessions[0].session_id);
        }
      } catch (error) {
        console.error('初始化数据库失败:', error);
        setError(`初始化数据库失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    initDatabase();
  }, [userId, selectedSession]);

  // 加载Notes数据
  const loadNotes = async (sessionId: string) => {
    if (!dbAPI) {
      console.log('数据库API未初始化');
      return;
    }
    
    try {
      setNotesLoading(true);
      setNotesError(null);
      
      console.log('加载笔记数据...', sessionId);
      const notesData = await dbAPI.getNotes(sessionId);
      console.log('笔记数据:', notesData);
      setNotes(notesData || []);
    } catch (error) {
      console.error('加载笔记失败:', error);
      setNotesError(`加载笔记失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && dbAPI) {
      loadNotes(sessionId);
    }
  }, [sessionId, dbAPI]);

  const handleDelete = async (id: string) => {
    if (!dbAPI) return;
    
    try {
      await dbAPI.deleteNote(id);
      // 重新加载笔记列表
      await loadNotes(sessionId);
    } catch (error) {
      console.error('删除笔记失败:', error);
      setNotesError('删除笔记失败，请重试');
    }
  };

  const handleSave = async () => {
    if (!editingNote || !sessionId || !dbAPI) return;

    try {
      const noteData = {
        action: editingNote.action || 'general',
        name: editingNote.name || `note_${Date.now()}`,
        title: editingNote.title || null,
        context: editingNote.context || '',
        select_status: editingNote.select_status || 0,
        priority: editingNote.priority || 0,
        tags: editingNote.tags || [],
        category: editingNote.category || null,
        session_id: sessionId,
      };

      if (editingNote.id) {
        // 更新现有笔记
        await dbAPI.updateNote(editingNote.id, noteData);
      } else {
        // 创建新笔记
        await dbAPI.createNote(noteData);
      }

      setDialogOpen(false);
      setEditingNote(null);
      
      // 重新加载笔记列表
      await loadNotes(sessionId);
    } catch (error) {
      console.error('保存笔记失败:', error);
      setNotesError('保存笔记失败，请重试');
    }
  };

  const handleArchive = async (id: string) => {
    if (!dbAPI) return;
    
    try {
      await dbAPI.updateNote(id, { 
        is_archived: true, 
        archived_at: new Date().toISOString() 
      });
      // 重新加载笔记列表
      await loadNotes(sessionId);
    } catch (error) {
      console.error('归档笔记失败:', error);
      setNotesError('归档笔记失败，请重试');
    }
  };

  const handleRefresh = async () => {
    if (sessionId) {
      await loadNotes(sessionId);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2: return "bg-red-100 text-red-800 border-red-200";
      case 1: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 2: return "已确认";
      case 1: return "已选择";
      default: return "未选择";
    }
  };

  // 过滤笔记
  const filteredNotes = notes.filter(note => {
    if (selectedAction && note.action !== selectedAction) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载笔记数据中...</span>
          </div>
        </div>
      </div>
    );
  }

  // 显示错误信息
  if (error) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">❌ 加载失败</div>
            <div className="text-muted-foreground mb-4">{error}</div>
            <Button onClick={() => window.location.reload()} variant="outline">
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              我的笔记
            </h1>
            <p className="text-muted-foreground mt-2">记录创作灵感与想法</p>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择会话" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.session_id} value={session.session_id}>
                    {session.metadata?.title || session.session_id.slice(-8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setEditingNote({ 
                    action: 'general', 
                    name: '', 
                    title: '', 
                    context: '',
                    tags: [],
                    category: null
                  })}
                  className="gradient-accent text-white shadow-glow"
                  disabled={!sessionId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新建笔记
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>{editingNote?.id ? "编辑笔记" : "新建笔记"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">动作类型</label>
                      <Input
                        value={editingNote?.action || ""}
                        onChange={(e) =>
                          setEditingNote((prev) => prev ? { ...prev, action: e.target.value } : null)
                        }
                        placeholder="如：character_analysis"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">笔记名称</label>
                      <Input
                        value={editingNote?.name || ""}
                        onChange={(e) =>
                          setEditingNote((prev) => prev ? { ...prev, name: e.target.value } : null)
                        }
                        placeholder="笔记唯一标识"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">笔记标题</label>
                    <Input
                      value={editingNote?.title || ""}
                      onChange={(e) =>
                        setEditingNote((prev) => prev ? { ...prev, title: e.target.value } : null)
                      }
                      placeholder="输入笔记标题"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">笔记内容</label>
                    <Textarea
                      value={editingNote?.context || ""}
                      onChange={(e) =>
                        setEditingNote((prev) => prev ? { ...prev, context: e.target.value } : null)
                      }
                      placeholder="输入笔记内容"
                      rows={8}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">优先级</label>
                      <Select 
                        value={editingNote?.priority?.toString() || "0"} 
                        onValueChange={(value) =>
                          setEditingNote((prev) => prev ? { ...prev, priority: parseInt(value) } : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">普通</SelectItem>
                          <SelectItem value="1">重要</SelectItem>
                          <SelectItem value="2">紧急</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">选择状态</label>
                      <Select 
                        value={editingNote?.select_status?.toString() || "0"} 
                        onValueChange={(value) =>
                          setEditingNote((prev) => prev ? { ...prev, select_status: parseInt(value) } : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">未选择</SelectItem>
                          <SelectItem value="1">已选择</SelectItem>
                          <SelectItem value="2">已确认</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">分类</label>
                      <Input
                        value={editingNote?.category || ""}
                        onChange={(e) =>
                          setEditingNote((prev) => prev ? { ...prev, category: e.target.value } : null)
                        }
                        placeholder="笔记分类"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleSave} className="w-full gradient-accent text-white">
                    保存
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="mb-6 flex gap-4 items-center">
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="按动作类型过滤" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部动作</SelectItem>
              <SelectItem value="character_analysis">角色分析</SelectItem>
              <SelectItem value="plot_development">情节发展</SelectItem>
              <SelectItem value="dialogue_writing">对话创作</SelectItem>
              <SelectItem value="scene_description">场景描述</SelectItem>
              <SelectItem value="general">通用笔记</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={notesLoading}
          >
            {notesLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            刷新
          </Button>
        </div>

        {/* 错误显示 */}
        {notesError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            加载笔记失败: {notesError}
          </div>
        )}

        {/* 笔记列表 */}
        {notesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>加载笔记中...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">暂无笔记</p>
                <p className="text-sm">选择会话并创建您的第一个笔记</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className="group relative p-6 hover:shadow-card transition-all duration-300 hover:scale-105 animate-fade-in border-border/50 hover:border-accent/50"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => {
                        setEditingNote(note);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-accent" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => handleArchive(note.id)}
                    >
                      <Archive className="h-3 w-3 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-lg font-semibold mb-2 pr-20 line-clamp-1">
                      {note.title || note.name}
                    </h3>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {note.action}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(note.priority)}`}>
                        {note.priority === 2 ? '紧急' : note.priority === 1 ? '重要' : '普通'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getStatusText(note.select_status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {note.context}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>创建于 {new Date(note.created_at).toLocaleDateString()}</span>
                    {note.category && (
                      <Badge variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {note.category}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;
