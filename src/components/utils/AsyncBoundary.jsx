import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }) {
  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardContent className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Page
        </Button>
      </CardContent>
    </Card>
  );
}

export function Retry({ onClick, message }) {
  return (
    <Card className="border-yellow-200 dark:border-yellow-800">
      <CardContent className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {message || 'Something went wrong. Please try again.'}
        </p>
        <Button
          onClick={onClick}
          className="rounded-xl"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * AsyncBoundary - Wraps components with error handling and loading states
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {React.ReactNode} props.fallback - Loading fallback (default: Skeleton)
 * @param {Function} props.onError - Error callback
 */
export function AsyncBoundary({ children, fallback, onError }) {
  const [error, setError] = useState(null);

  if (error) {
    return <Retry onClick={() => window.location.reload()} />;
  }

  return (
    <ErrorBoundary 
      onError={(err) => {
        setError(err);
        if (onError) onError(err);
      }}
      fallback={fallback || <LoadingSkeleton />}
    >
      {children}
    </ErrorBoundary>
  );
}