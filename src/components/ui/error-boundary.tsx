import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card/30 to-background">
          <Card className="w-full max-w-2xl glass-card border-destructive/20 shadow-card">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                出现了意外错误
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  很抱歉，应用程序遇到了一个意外错误。我们的团队已经收到通知，正在努力修复这个问题。
                </p>
                {this.state.error && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      查看错误详情
                    </summary>
                    <pre className="mt-2 p-3 bg-muted/50 rounded text-xs text-muted-foreground overflow-auto">
                      {this.state.error.message}
                      {this.state.error.stack && (
                        <>
                          {'\n\n'}
                          {this.state.error.stack}
                        </>
                      )}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="gradient-button text-white shadow-glow"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  <Home className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                如果问题持续存在，请联系我们的技术支持团队
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
