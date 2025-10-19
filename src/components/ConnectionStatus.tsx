/**
 * 连接状态组件
 * 显示流式对话的连接状态、心跳状态和重连信息
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Heart, 
  HeartCrack,
  Clock,
  AlertCircle
} from 'lucide-react';

export interface ConnectionStatusProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  heartbeatStatus: 'active' | 'inactive' | 'error';
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  onRetry?: () => void;
  className?: string;
}

export function ConnectionStatus({
  connectionStatus,
  heartbeatStatus,
  lastHeartbeat,
  reconnectAttempts,
  maxReconnectAttempts,
  onRetry,
  className = '',
}: ConnectionStatusProps) {
  // 连接状态配置
  const connectionConfig = {
    connecting: {
      icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      label: '连接中',
      variant: 'secondary' as const,
      color: 'text-blue-600',
    },
    connected: {
      icon: <Wifi className="w-3 h-3" />,
      label: '已连接',
      variant: 'default' as const,
      color: 'text-green-600',
    },
    disconnected: {
      icon: <WifiOff className="w-3 h-3" />,
      label: '已断开',
      variant: 'destructive' as const,
      color: 'text-red-600',
    },
    reconnecting: {
      icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      label: `重连中 (${reconnectAttempts}/${maxReconnectAttempts})`,
      variant: 'secondary' as const,
      color: 'text-yellow-600',
    },
  };

  // 心跳状态配置
  const heartbeatConfig = {
    active: {
      icon: <Heart className="w-3 h-3" />,
      label: '心跳正常',
      variant: 'default' as const,
      color: 'text-green-600',
    },
    inactive: {
      icon: <HeartCrack className="w-3 h-3" />,
      label: '心跳停止',
      variant: 'secondary' as const,
      color: 'text-gray-500',
    },
    error: {
      icon: <HeartCrack className="w-3 h-3" />,
      label: '心跳异常',
      variant: 'destructive' as const,
      color: 'text-red-600',
    },
  };

  const formatLastHeartbeat = (date: Date | null) => {
    if (!date) return '从未';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}秒前`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    return date.toLocaleTimeString();
  };

  const currentConnection = connectionConfig[connectionStatus];
  const currentHeartbeat = heartbeatConfig[heartbeatStatus];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 连接状态 */}
      <Badge variant={currentConnection.variant} className="flex items-center gap-1">
        {currentConnection.icon}
        <span className={currentConnection.color}>
          {currentConnection.label}
        </span>
      </Badge>

      {/* 心跳状态 */}
      {connectionStatus === 'connected' && (
        <Badge variant={currentHeartbeat.variant} className="flex items-center gap-1">
          {currentHeartbeat.icon}
          <span className={currentHeartbeat.color}>
            {currentHeartbeat.label}
          </span>
        </Badge>
      )}

      {/* 最后心跳时间 */}
      {lastHeartbeat && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>上次心跳: {formatLastHeartbeat(lastHeartbeat)}</span>
        </div>
      )}

      {/* 重连信息 */}
      {connectionStatus === 'reconnecting' && (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <AlertCircle className="w-3 h-3" />
          <span>正在重连...</span>
        </div>
      )}

      {/* 重试按钮 */}
      {(connectionStatus === 'disconnected' || heartbeatStatus === 'error') && onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          重试
        </Button>
      )}
    </div>
  );
}

// 简化版本，只显示基本状态
export function SimpleConnectionStatus({
  connectionStatus,
  heartbeatStatus,
  className = '',
}: Pick<ConnectionStatusProps, 'connectionStatus' | 'heartbeatStatus' | 'className'>) {
  const getStatusColor = () => {
    if (connectionStatus === 'connected' && heartbeatStatus === 'active') {
      return 'text-green-500';
    }
    if (connectionStatus === 'connected' && heartbeatStatus === 'error') {
      return 'text-yellow-500';
    }
    if (connectionStatus === 'reconnecting') {
      return 'text-yellow-500';
    }
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (connectionStatus === 'connected' && heartbeatStatus === 'active') {
      return '●';
    }
    if (connectionStatus === 'connected' && heartbeatStatus === 'error') {
      return '⚠';
    }
    if (connectionStatus === 'reconnecting') {
      return '⟳';
    }
    return '●';
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`text-lg ${getStatusColor()}`} title={connectionStatus}>
        {getStatusText()}
      </span>
    </div>
  );
}
