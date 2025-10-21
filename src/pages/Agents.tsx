/**
 * 智能体管理页面
 * 展示和管理各种智能体的状态和功能
 */

import { useState, useEffect } from "react";
import { Bot, Play, Square, Loader2, Info, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import { jubenApi, AgentInfo } from "@/lib/api";
import { createDatabaseAPI } from "@/lib/database";

interface AgentStatus extends AgentInfo {
  isRunning?: boolean;
  lastUsed?: string;
  usageCount?: number;
  totalTokens?: number;
  totalCost?: number;
}

const agentTypes = [
  // 核心创作智能体
  { 
    value: "planner", 
    label: "短剧策划智能体", 
    description: "基于爆款引擎理论的短剧整体策划专家。负责市场趋势分析、用户画像构建、竞品分析、创意构思和主题定位。通过深度学习小红书、抖音等平台的爆款内容规律，为短剧项目提供科学的策划方案。包含目标受众分析、内容定位、传播策略、商业价值评估等核心功能。", 
    category: "创作核心" 
  },
  { 
    value: "creator", 
    label: "短剧创作智能体", 
    description: "专业的剧本创作引擎，负责从策划到成品的完整创作流程。具备对话生成、场景描述、角色塑造、情节设计、冲突构建等核心能力。支持多种短剧类型（都市情感、古装言情、悬疑推理等），能够根据用户需求生成符合平台特点的剧本内容。包含分镜头脚本、台词优化、节奏控制等专业功能。", 
    category: "创作核心" 
  },
  { 
    value: "evaluation", 
    label: "剧本评估智能体", 
    description: "多维度剧本质量评估系统，提供结构分析、内容质量评估、商业价值评估、市场适应性分析等专业服务。通过AI算法对剧本进行深度分析，包括情节逻辑性、角色一致性、对话自然度、冲突强度、情感共鸣度等维度评分。提供具体的改进建议和优化方案，确保剧本质量。", 
    category: "创作核心" 
  },
  
  // 分析智能体
  { 
    value: "story-analysis", 
    label: "故事五元素分析器", 
    description: "深度解析故事的五元素结构（人物、情节、环境、主题、风格），通过NLP技术对故事进行结构化分析。识别故事的核心冲突、情感线索、主题表达、人物弧光等关键要素。提供故事强度分析、情感曲线分析、冲突升级分析等专业报告，为故事优化提供科学依据。", 
    category: "分析工具" 
  },
  { 
    value: "series-analysis", 
    label: "已播剧集分析器", 
    description: "专业分析已播剧集的成功要素和规律模式。通过大数据分析热门剧集的内容特征、叙事结构、角色设定、情感节奏等关键要素。提取爆款内容的共同特征，分析用户喜好变化趋势，为创作提供数据支撑。包含收视率分析、用户评论情感分析、传播路径分析等功能。", 
    category: "分析工具" 
  },
  { 
    value: "story-five-elements", 
    label: "故事五要素深度分析器", 
    description: "专门针对故事五要素进行深度分析的专业工具。通过AI算法识别和分析故事中的人物设定、情节发展、环境背景、主题表达、叙事风格等核心要素。提供要素完整性分析、要素间关联性分析、要素强度评估等专业功能，帮助创作者优化故事结构。", 
    category: "分析工具" 
  },
  { 
    value: "character-profile-generator", 
    label: "角色档案生成器", 
    description: "智能生成详细角色档案和背景故事的专业工具。基于角色类型、故事需求、目标受众等参数，自动生成角色的基本信息、性格特征、成长背景、人际关系、价值观念等详细档案。支持角色一致性检查、角色发展轨迹规划、角色关系网络构建等高级功能。", 
    category: "分析工具" 
  },
  { 
    value: "character-relationship-analyzer", 
    label: "角色关系分析器", 
    description: "深度分析角色间复杂关系网络的专业工具。通过图论算法构建角色关系图谱，分析角色间的互动模式、冲突关系、情感纽带、权力结构等。提供关系强度分析、关系发展轨迹预测、关系冲突优化等高级功能，帮助优化角色设定和情节发展。", 
    category: "分析工具" 
  },
  { 
    value: "story-type-analyzer", 
    label: "故事类型分析器", 
    description: "智能识别和分析故事类型特征的专业工具。通过机器学习算法识别故事的类型标签（如都市言情、古装剧、悬疑剧等），分析类型特征、叙事模式、受众定位等关键要素。提供类型匹配度分析、类型创新建议、跨类型融合分析等功能，帮助确定创作方向。", 
    category: "分析工具" 
  },
  { 
    value: "drama-analysis", 
    label: "戏剧分析器", 
    description: "专业分析戏剧结构和表演元素的工具。通过戏剧理论分析剧本的戏剧性、冲突强度、情感张力、节奏控制等关键要素。提供舞台效果分析、表演指导建议、戏剧冲突优化等功能。适用于需要深度戏剧化处理的短剧项目。", 
    category: "分析工具" 
  },
  
  // 情节点智能体
  { 
    value: "plot-points-workflow", 
    label: "大情节点工作流管理器", 
    description: "完整的情节点生成和管理工作流系统。负责从故事大纲到详细情节点的全流程管理，包括情节点生成、结构规划、节奏控制、冲突设计等核心功能。支持多种情节点模式（三幕式、五幕式、英雄之旅等），提供情节点强度分析、节奏优化、冲突升级等专业功能。", 
    category: "情节点" 
  },
  { 
    value: "plot-points-analyzer", 
    label: "情节点分析器", 
    description: "专业分析情节发展关键节点的工具。通过AI算法识别故事中的关键情节点、转折点、高潮点等，分析情节点的发展轨迹、强度变化、逻辑合理性等。提供情节点优化建议、节奏调整方案、冲突升级策略等功能，确保情节发展的逻辑性和吸引力。", 
    category: "情节点" 
  },
  { 
    value: "detailed-plot-points", 
    label: "详细情节点生成器", 
    description: "生成详细情节点描述的专业工具。基于故事大纲和主要情节点，自动生成包含场景描述、角色动作、对话要点、情感表达等详细内容的情节点描述。支持多种描述风格（文学性、商业性、技术性等），提供情节点强度评估、描述优化建议等功能。", 
    category: "情节点" 
  },
  { 
    value: "major-plot-points", 
    label: "大情节点分析器", 
    description: "专门分析故事大情节点结构的专业工具。通过故事结构理论分析故事的开端、发展、高潮、结局等大情节点，评估情节点设置的合理性、强度分布、逻辑连贯性等。提供情节点优化建议、结构重组方案、节奏调整策略等功能，确保故事结构的完整性。", 
    category: "情节点" 
  },
  { 
    value: "story-summary", 
    label: "故事大纲生成器", 
    description: "智能生成故事大纲和概要的专业工具。基于故事内容自动提取关键信息，生成包含故事背景、主要人物、核心冲突、发展脉络、结局等要素的故事大纲。支持多种大纲格式（传统大纲、分幕大纲、情节点大纲等），提供大纲完整性检查、逻辑性分析等功能。", 
    category: "情节点" 
  },
  { 
    value: "mind-map", 
    label: "思维导图生成器", 
    description: "可视化故事结构的专业工具。将复杂的故事结构转化为直观的思维导图，展示故事脉络、人物关系、情节点分布、主题层次等关键信息。支持多种导图样式（树状图、网络图、时间轴等），提供交互式浏览、结构优化建议、可视化分析等功能。", 
    category: "情节点" 
  },
  
  // 评估智能体
  { 
    value: "script-evaluation", 
    label: "剧本评估器", 
    description: "专业的多维度剧本评估系统。通过AI算法对剧本进行深度分析，包括结构完整性、逻辑合理性、角色一致性、对话自然度、冲突强度、情感共鸣度等多个维度。提供详细的评估报告、改进建议、评分标准说明等专业服务，确保剧本质量达到商业标准。", 
    category: "评估工具" 
  },
  { 
    value: "story-outline-evaluation", 
    label: "故事大纲评估器", 
    description: "专门评估故事大纲质量和完整性的专业工具。分析大纲的结构完整性、逻辑连贯性、情节合理性、角色设定一致性等关键要素。提供大纲优化建议、结构重组方案、内容补充指导等功能，确保故事大纲能够支撑完整的剧本创作。", 
    category: "评估工具" 
  },
  { 
    value: "story-evaluation", 
    label: "故事评估器", 
    description: "综合评估故事整体质量的专业工具。从故事创意、结构设计、角色塑造、情节发展、主题表达等多个维度进行综合评估。提供故事强度分析、市场适应性评估、受众匹配度分析等专业功能，为故事优化和商业化提供科学依据。", 
    category: "评估工具" 
  },
  { 
    value: "novel-screening-evaluation", 
    label: "小说筛选评估器", 
    description: "专业评估小说质量和商业价值的工具。通过AI算法分析小说的文学价值、商业潜力、市场适应性、改编可行性等关键要素。提供小说质量评分、商业价值评估、改编建议、市场定位分析等专业服务，为IP开发提供决策支持。", 
    category: "评估工具" 
  },
  { 
    value: "text-processor-evaluation", 
    label: "文本处理评估器", 
    description: "评估文本处理质量和准确性的专业工具。分析文本处理的准确性、完整性、一致性等关键指标，检查文本格式、语言规范、逻辑结构等要素。提供处理质量评分、错误识别、优化建议等功能，确保文本处理结果的专业性和可靠性。", 
    category: "评估工具" 
  },
  { 
    value: "result-analyzer-evaluation", 
    label: "结果分析评估器", 
    description: "分析评估结果可靠性和准确性的专业工具。通过统计分析、数据挖掘等技术评估分析结果的可信度、准确性、完整性等关键指标。提供结果验证、误差分析、置信度评估等功能，确保分析结果的专业性和可信度。", 
    category: "评估工具" 
  },
  { 
    value: "ip-evaluation", 
    label: "IP价值评估器", 
    description: "专业评估IP商业价值和市场潜力的工具。通过多维度分析评估IP的原创性、市场价值、商业潜力、开发可行性等关键要素。提供IP价值评分、市场定位分析、开发建议、投资风险评估等专业服务，为IP商业化决策提供科学依据。", 
    category: "评估工具" 
  },
  
  // 工具智能体
  { 
    value: "websearch", 
    label: "网络搜索助手", 
    description: "提供实时网络搜索和信息收集的专业工具。支持多平台搜索（百度、谷歌、必应等），能够智能筛选相关信息、去重处理、质量评估。提供搜索策略优化、结果排序、信息验证等功能，确保搜索结果的准确性和时效性。支持多语言搜索、专业领域搜索等高级功能。", 
    category: "工具" 
  },
  { 
    value: "knowledge", 
    label: "知识库查询助手", 
    description: "从专业知识库中检索相关信息的智能工具。支持多源知识库查询（学术数据库、行业报告、专业文献等），提供智能匹配、相关性排序、信息整合等功能。支持自然语言查询、专业术语识别、知识图谱构建等高级功能，为创作提供权威的信息支持。", 
    category: "工具" 
  },
  { 
    value: "file-reference", 
    label: "文件引用解析助手", 
    description: "智能解析和处理文件引用的专业工具。支持多种文件格式（PDF、Word、Excel、PPT等），能够提取文件内容、识别引用关系、分析文档结构。提供引用完整性检查、内容提取、格式转换等功能，确保文件引用的准确性和完整性。", 
    category: "工具" 
  },
  { 
    value: "document-generator", 
    label: "文档生成器", 
    description: "生成各类格式文档的专业工具。支持多种文档格式（Word、PDF、HTML、Markdown等），能够根据模板自动生成报告、提案、剧本等专业文档。提供格式优化、内容美化、结构整理等功能，确保生成文档的专业性和可读性。", 
    category: "工具" 
  },
  { 
    value: "output-formatter", 
    label: "输出格式化器", 
    description: "专业格式化输出内容的工具。支持多种输出格式（JSON、XML、CSV、表格等），能够智能识别内容结构、优化格式布局、提升可读性。提供格式验证、内容美化、结构优化等功能，确保输出内容的专业性和一致性。", 
    category: "工具" 
  },
  { 
    value: "text-splitter", 
    label: "文本分割器", 
    description: "智能分割长文本内容的专业工具。支持多种分割策略（按段落、按句子、按字数等），能够保持内容逻辑完整性。提供分割质量评估、内容重组、逻辑优化等功能，确保分割后的内容保持原有的逻辑结构和可读性。", 
    category: "工具" 
  },
  { 
    value: "text-truncator", 
    label: "文本截断器", 
    description: "智能截断过长文本的专业工具。支持多种截断策略（按长度、按段落、按语义等），能够保持内容完整性。提供截断质量评估、内容优化、长度控制等功能，确保截断后的内容保持原有的信息价值和可读性。", 
    category: "工具" 
  },
  { 
    value: "score-analyzer", 
    label: "评分分析器", 
    description: "专业分析评分数据和趋势的工具。支持多种评分模型（加权平均、标准化评分、趋势分析等），能够识别评分模式、分析评分趋势、预测评分变化。提供评分可视化、趋势预测、异常检测等功能，为决策提供数据支持。", 
    category: "工具" 
  },
  
  // 工作流智能体
  { 
    value: "drama-workflow", 
    label: "戏剧工作流管理器", 
    description: "管理戏剧创作完整流程的专业工具。负责从创意构思到成品发布的全流程管理，包括任务分解、进度跟踪、质量控制、团队协作等核心功能。支持多种工作流模式（瀑布式、敏捷式、混合式等），提供流程优化、效率分析、资源调度等功能。", 
    category: "工作流" 
  },
  { 
    value: "series-analysis-orchestrator", 
    label: "系列分析编排器", 
    description: "协调系列分析复杂流程的专业工具。负责管理多个分析任务的执行顺序、数据流转、结果整合等关键环节。支持并行处理、任务调度、结果合并等高级功能，确保分析流程的高效性和准确性。提供流程监控、异常处理、结果验证等功能。", 
    category: "工作流" 
  },
  { 
    value: "juben-orchestrator", 
    label: "剧本文本编排器", 
    description: "协调整体创作流程和智能体协作的核心工具。负责管理多个智能体的任务分配、数据流转、结果整合等关键环节。支持智能体调度、任务优化、结果融合等高级功能，确保创作流程的高效性和一致性。提供流程监控、性能分析、优化建议等功能。", 
    category: "工作流" 
  },
  { 
    value: "juben-concierge", 
    label: "剧本文本管家", 
    description: "提供综合服务的智能管家系统。负责统一管理各种智能体服务，提供智能路由、服务协调、用户交互等核心功能。支持服务发现、负载均衡、故障恢复等高级功能，确保系统的高可用性和用户体验。提供服务监控、性能分析、用户支持等功能。", 
    category: "工作流" 
  },
  
  // 信息智能体
  { 
    value: "series-info", 
    label: "剧集信息获取器", 
    description: "专业获取剧集基础信息和数据的工具。支持多平台数据源（爱奇艺、腾讯视频、优酷等），能够获取剧集的基本信息、播放数据、用户评价等关键数据。提供数据清洗、格式标准化、质量验证等功能，确保数据的准确性和完整性。", 
    category: "信息" 
  },
  { 
    value: "series-name-extractor", 
    label: "剧集名称提取器", 
    description: "智能提取剧集名称和信息的专业工具。通过NLP技术识别和提取剧集名称、别名、英文名等信息，支持多语言处理、模糊匹配、去重处理等高级功能。提供名称标准化、关联分析、信息验证等功能，确保剧集信息的准确性和一致性。", 
    category: "信息" 
  },
  { 
    value: "result-integrator", 
    label: "结果整合器", 
    description: "整合多个分析结果生成综合报告的专业工具。支持多源数据整合、结果融合、报告生成等核心功能。提供数据清洗、格式统一、逻辑整合等功能，确保综合报告的专业性和可读性。支持多种报告格式（PDF、Word、HTML等）。", 
    category: "信息" 
  },
];

const Agents = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [dbAPI, setDbAPI] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      // 调用后端API获取智能体列表
      const response = await fetch('/agents/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 API响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 API返回数据:', result);
      
      if (result.success && result.data && result.data.agents) {
        // 转换API返回的数据格式
        const agentsFromAPI: AgentStatus[] = result.data.agents.map((agent: any) => ({
          id: agent.name,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities || [],
          status: agent.status === 'available' ? 'active' : 'inactive',
          isRunning: false,
          lastUsed: null,
          usageCount: 0,
          totalTokens: 0,
          totalCost: 0,
        }));
        
        setAgents(agentsFromAPI);
        console.log('✅ 成功加载智能体:', agentsFromAPI.length, '个');
        console.log('📋 智能体列表:', agentsFromAPI.map(a => a.name));
      } else {
        console.error('❌ API返回数据格式错误:', result);
        setAgents([]);
      }
    } catch (error) {
      console.error('❌ 加载智能体失败:', error);
      
      // 如果API调用失败，使用本地数据作为备选
      const fallbackAgents: AgentStatus[] = agentTypes.map((type) => ({
        id: type.value,
        name: type.label,
        description: type.description,
        capabilities: getCapabilities(type.value),
        status: 'inactive',
        isRunning: false,
        lastUsed: null,
        usageCount: 0,
        totalTokens: 0,
        totalCost: 0,
      }));
      
      setAgents(fallbackAgents);
      console.log('⚠️ 使用备选数据:', fallbackAgents.length, '个智能体');
    } finally {
      setLoading(false);
    }
  };

  const getCapabilities = (agentType: string): string[] => {
    const capabilityMap: Record<string, string[]> = {
      // 创作核心
      planner: ['创意构思', '市场分析', '用户画像', '竞品分析', '爆款引擎理论'],
      creator: ['剧本创作', '对话生成', '场景描述', '角色塑造', '内容优化'],
      evaluation: ['质量评估', '结构分析', '改进建议', '评分系统', '多维度评估'],
      
      // 分析工具
      'story-analysis': ['五元素分析', '结构解析', '主题识别', '情感分析'],
      'series-analysis': ['剧集分析', '模式识别', '趋势预测', '成功要素'],
      'story-five-elements': ['五要素分析', '结构解析', '要素提取'],
      'character-profile-generator': ['角色档案', '背景故事', '性格分析'],
      'character-relationship-analyzer': ['关系分析', '互动网络', '关系图谱'],
      'story-type-analyzer': ['类型识别', '特征分析', '分类管理'],
      'drama-analysis': ['戏剧结构', '表演元素', '舞台分析'],
      
      // 情节点
      'plot-points-workflow': ['情节点生成', '结构规划', '节奏控制', '冲突设计'],
      'plot-points-analyzer': ['情节点分析', '发展轨迹', '关键点识别'],
      'detailed-plot-points': ['详细情节', '场景描述', '细节生成'],
      'major-plot-points': ['情节点分析', '结构优化', '节奏调整', '冲突升级'],
      'story-summary': ['大纲生成', '概要提取', '关键信息', '结构梳理'],
      'mind-map': ['思维导图', '可视化', '结构展示'],
      
      // 评估工具
      'script-evaluation': ['剧本评估', '质量分析', '改进建议'],
      'story-outline-evaluation': ['大纲评估', '完整性检查', '质量评分'],
      'story-evaluation': ['综合评估', '整体分析', '质量报告'],
      'novel-screening-evaluation': ['小说筛选', '质量评估', '商业价值'],
      'text-processor-evaluation': ['文本处理', '质量检查', '准确性验证'],
      'result-analyzer-evaluation': ['结果分析', '可靠性验证', '数据解读'],
      'ip-evaluation': ['IP评估', '商业价值', '潜力分析'],
      
      // 工具
      websearch: ['实时搜索', '信息收集', '数据验证', '趋势分析'],
      knowledge: ['知识检索', '信息提取', '内容匹配', '智能推荐'],
      'file-reference': ['文件解析', '引用提取', '内容分析', '结构识别'],
      'document-generator': ['文档生成', '格式转换', '内容整理'],
      'output-formatter': ['格式优化', '内容美化', '结构整理'],
      'text-splitter': ['文本分割', '智能切分', '内容重组'],
      'text-truncator': ['文本截断', '长度控制', '内容精简'],
      'score-analyzer': ['评分分析', '数据统计', '趋势分析'],
      
      // 工作流
      'drama-workflow': ['工作流管理', '流程控制', '任务协调'],
      'series-analysis-orchestrator': ['流程编排', '任务调度', '结果整合'],
      'juben-orchestrator': ['整体编排', '智能体协作', '流程优化'],
      'juben-concierge': ['综合服务', '智能路由', '协调管理'],
      
      // 信息
      'series-info': ['信息获取', '数据收集', '基础信息'],
      'series-name-extractor': ['名称提取', '信息识别', '智能解析'],
      'result-integrator': ['结果整合', '报告生成', '综合分析'],
    };
    return capabilityMap[agentType] || ['基础功能'];
  };

  const getBusinessLogic = (agentType: string): string => {
    const businessLogicMap: Record<string, string> = {
      // 创作核心
      planner: '基于爆款引擎理论，通过深度学习平台数据，分析用户行为模式，构建目标受众画像，制定科学的策划方案。',
      creator: '采用多轮对话生成技术，结合角色设定和情节发展，生成符合平台特点的剧本内容，支持多种创作风格。',
      evaluation: '通过多维度AI算法分析剧本质量，包括结构完整性、逻辑合理性、商业价值等，提供专业评估报告。',
      
      // 分析工具
      'story-analysis': '运用NLP技术深度解析故事结构，识别核心冲突、情感线索、主题表达等关键要素，提供科学分析报告。',
      'series-analysis': '通过大数据分析热门剧集特征，提取成功要素，分析用户喜好变化，为创作提供数据支撑。',
      'story-five-elements': '基于故事理论，通过AI算法分析人物、情节、环境、主题、风格五要素的完整性和关联性。',
      'character-profile-generator': '基于角色类型和故事需求，自动生成详细角色档案，支持角色一致性检查和关系网络构建。',
      'character-relationship-analyzer': '运用图论算法构建角色关系图谱，分析互动模式、冲突关系、情感纽带等复杂关系。',
      'story-type-analyzer': '通过机器学习识别故事类型特征，分析叙事模式、受众定位，提供类型匹配度分析和创新建议。',
      'drama-analysis': '基于戏剧理论分析剧本的戏剧性、冲突强度、情感张力，提供舞台效果分析和表演指导建议。',
      
      // 情节点
      'plot-points-workflow': '管理从故事大纲到详细情节点的全流程，支持多种情节点模式，提供强度分析和节奏优化。',
      'plot-points-analyzer': '通过AI算法识别关键情节点，分析发展轨迹和逻辑合理性，提供优化建议和节奏调整方案。',
      'detailed-plot-points': '基于故事大纲自动生成详细情节点描述，支持多种描述风格，提供强度评估和优化建议。',
      'major-plot-points': '运用故事结构理论分析大情节点设置，评估合理性、强度分布、逻辑连贯性，提供结构优化方案。',
      'story-summary': '智能提取故事关键信息，生成包含背景、人物、冲突、发展脉络的完整大纲，支持多种格式。',
      'mind-map': '将复杂故事结构可视化，展示脉络、关系、分布、层次等关键信息，支持交互式浏览和结构优化。',
      
      // 评估工具
      'script-evaluation': '通过多维度AI算法深度分析剧本，包括结构、逻辑、角色、对话、冲突、情感等维度专业评分。',
      'story-outline-evaluation': '分析大纲的结构完整性、逻辑连贯性、情节合理性，提供优化建议和内容补充指导。',
      'story-evaluation': '从创意、结构、角色、情节、主题等维度综合评估，提供强度分析、市场适应性、受众匹配度分析。',
      'novel-screening-evaluation': '通过AI算法分析小说的文学价值、商业潜力、市场适应性、改编可行性，提供专业评估服务。',
      'text-processor-evaluation': '分析文本处理的准确性、完整性、一致性，检查格式、语言、逻辑等要素，确保专业性。',
      'result-analyzer-evaluation': '通过统计分析、数据挖掘技术评估结果的可信度、准确性、完整性，提供验证和误差分析。',
      'ip-evaluation': '多维度分析IP的原创性、市场价值、商业潜力、开发可行性，提供价值评分和投资风险评估。',
      
      // 工具
      websearch: '支持多平台搜索，智能筛选相关信息，提供搜索策略优化、结果排序、信息验证等专业功能。',
      knowledge: '从多源知识库检索信息，提供智能匹配、相关性排序、信息整合，支持自然语言查询和知识图谱构建。',
      'file-reference': '支持多种文件格式解析，提取内容、识别引用关系、分析文档结构，提供完整性检查和格式转换。',
      'document-generator': '根据模板自动生成各类格式文档，提供格式优化、内容美化、结构整理等专业功能。',
      'output-formatter': '智能识别内容结构，优化格式布局，提供格式验证、内容美化、结构优化等功能。',
      'text-splitter': '支持多种分割策略，保持内容逻辑完整性，提供分割质量评估、内容重组、逻辑优化。',
      'text-truncator': '智能截断过长文本，保持内容完整性，提供截断质量评估、内容优化、长度控制。',
      'score-analyzer': '支持多种评分模型，识别评分模式、分析趋势、预测变化，提供可视化和异常检测。',
      
      // 工作流
      'drama-workflow': '管理从创意到发布的全流程，支持多种工作流模式，提供任务分解、进度跟踪、质量控制。',
      'series-analysis-orchestrator': '协调复杂分析流程，管理任务执行顺序、数据流转、结果整合，支持并行处理和异常处理。',
      'juben-orchestrator': '协调整体创作流程，管理智能体任务分配、数据流转、结果整合，支持调度优化和性能分析。',
      'juben-concierge': '提供综合服务管理，智能路由、服务协调、用户交互，支持服务发现、负载均衡、故障恢复。',
      
      // 信息
      'series-info': '支持多平台数据源，获取剧集基本信息、播放数据、用户评价，提供数据清洗、格式标准化、质量验证。',
      'series-name-extractor': '通过NLP技术识别提取剧集名称信息，支持多语言处理、模糊匹配、去重处理、名称标准化。',
      'result-integrator': '整合多源数据，融合分析结果，生成综合报告，提供数据清洗、格式统一、逻辑整合。',
    };
    return businessLogicMap[agentType] || '提供基础功能支持，确保系统稳定运行。';
  };

  // 获取所有分类
  const categories = ["all", ...Array.from(new Set(agentTypes.map(agent => agent.category)))];
  
  // 过滤智能体
  const filteredAgents = agents.filter(agent => {
    const matchesCategory = selectedCategory === "all" || 
      agentTypes.find(type => type.value === agent.id)?.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string, isRunning?: boolean) => {
    if (isRunning) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string, isRunning?: boolean) => {
    if (isRunning) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">运行中</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">活跃</Badge>;
      case 'inactive':
        return <Badge variant="destructive">离线</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const handleGetAgentInfo = async (agentType: string) => {
    try {
      const info = await jubenApi.getAgentInfo(agentType);
      setAgentInfo(info);
      setSelectedAgent(agentType);
    } catch (error) {
      console.error('获取智能体信息失败:', error);
      // 使用模拟数据
      const agent = agents.find(a => a.id === agentType);
      if (agent) {
        setAgentInfo({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          capabilities: agent.capabilities,
          status: agent.status,
        });
        setSelectedAgent(agentType);
      }
    }
  };

  const handleTestAgent = async (agentType: string) => {
    try {
      // 模拟测试智能体
      console.log(`测试智能体: ${agentType}`);
      // 这里可以调用实际的测试API
    } catch (error) {
      console.error('测试智能体失败:', error);
    }
  };

  const handleSwitchAgent = async (agentType: string) => {
    try {
      // 调用智能体切换API
      const response = await fetch('/agents/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'demo_user_001',
          session_id: 'demo_session_001',
          agent_name: agentType,
          switch_reason: '用户主动切换'
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('智能体切换成功:', result.data);
        // 这里可以添加成功提示
      } else {
        console.error('智能体切换失败:', result.error);
      }
    } catch (error) {
      console.error('智能体切换失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>加载智能体中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">🤖 专业AI智能体管理中心</h1>
            <p className="text-muted-foreground">
              管理40+专业智能体，覆盖短剧创作全流程。实时监控智能体状态、性能指标和业务逻辑，提供专业的创作支持服务
            </p>
          </div>

          {/* 过滤器和搜索 */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索智能体..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有分类</option>
                {categories.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{filteredAgents.length}</div>
              <div className="text-muted-foreground">总智能体数</div>
            </div>
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{filteredAgents.filter(a => a.status === 'active').length}</div>
              <div className="text-muted-foreground">活跃智能体</div>
            </div>
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{Array.from(new Set(filteredAgents.map(a => agentTypes.find(type => type.value === a.id)?.category).filter(Boolean))).length}</div>
              <div className="text-muted-foreground">专业分类</div>
            </div>
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{filteredAgents.reduce((sum, agent) => sum + (agent.usageCount || 0), 0)}</div>
              <div className="text-muted-foreground">总使用次数</div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(agent.status, agent.isRunning)}
                      {getStatusBadge(agent.status, agent.isRunning)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {agentTypes.find(type => type.value === agent.id)?.category || '未分类'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {agent.description}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">核心能力:</h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 4).map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">业务逻辑:</h4>
                      <div className="text-xs text-muted-foreground">
                        {getBusinessLogic(agent.id)}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>使用次数: {agent.usageCount || 0}</span>
                        {agent.lastUsed && (
                          <span>最后使用: {new Date(agent.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                      {(agent.totalTokens || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span>总Token: {agent.totalTokens?.toLocaleString() || 0}</span>
                          <span>总成本: {agent.totalCost?.toFixed(2) || 0} 积分</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleGetAgentInfo(agent.id)}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            详情
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Bot className="h-5 w-5" />
                              {agentInfo?.name || agent.name}
                            </DialogTitle>
                            <DialogDescription>
                              {agentInfo?.description || agent.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">状态信息</h4>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(agent.status, agent.isRunning)}
                                {getStatusBadge(agent.status, agent.isRunning)}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">核心能力</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {(agentInfo?.capabilities || agent.capabilities).map((capability) => (
                                  <Badge key={capability} variant="outline" className="justify-center">
                                    {capability}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">使用次数:</span>
                                <span className="ml-2 font-medium">{agent.usageCount || 0}</span>
                              </div>
                              {agent.lastUsed && (
                                <div>
                                  <span className="text-muted-foreground">最后使用:</span>
                                  <span className="ml-2 font-medium">
                                    {new Date(agent.lastUsed).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleTestAgent(agent.id)}
                        disabled={agent.status === 'inactive'}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        测试
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSwitchAgent(agent.id)}
                        disabled={agent.status === 'inactive'}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        切换
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Agents;
