import React, { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
          <div className="w-full max-w-2xl">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-lg">Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4 text-base">
                  An unexpected error occurred. This may be due to a missing module or a configuration issue.
                </p>
                {this.state.error && (
                  <div className="mb-4">
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm font-medium mb-2 hover:text-destructive">
                        Error Details
                      </summary>
                      <div className="mt-2 p-3 bg-destructive/10 rounded border border-destructive/20">
                        <p className="text-sm font-mono text-destructive mb-2 break-words">
                          {this.state.error.message || this.state.error.toString()}
                        </p>
                        {this.state.error.stack && (
                          <pre className="text-xs text-muted-foreground overflow-auto max-h-64 whitespace-pre-wrap break-words">
                            {this.state.error.stack}
                          </pre>
                        )}
                      </div>
                    </details>
                    {this.state.error.message?.includes("does not provide an export") && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>Module Export Error:</strong> This usually means there's a missing export or a circular dependency. 
                          Check the browser console for more details.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={this.handleReset} variant="outline" size="default">
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                    size="default"
                  >
                    Reload Page
                  </Button>
                  <Button
                    onClick={() => {
                      if (this.state.error) {
                        const errorInfo = `Error: ${this.state.error.message}\n\nStack: ${this.state.error.stack || "No stack trace"}`;
                        navigator.clipboard.writeText(errorInfo).catch(() => {
                          // Fallback if clipboard fails
                        });
                      }
                    }}
                    variant="ghost"
                    size="default"
                  >
                    Copy Error
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
