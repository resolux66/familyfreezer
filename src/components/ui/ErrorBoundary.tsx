import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

// 📘 React Native Note — Error Boundaries must be class components
// React's error boundary API (getDerivedStateFromError + componentDidCatch)
// is only available in class components — there is no hook equivalent.
// Functional components cannot catch render errors from their children.
//
// getDerivedStateFromError  — converts the thrown Error into state so the
//                             fallback UI renders synchronously.
// componentDidCatch         — fires after the render, used for logging.
//                             Never update state here; use getDerivedStateFromError.
//
// The boundary catches errors in any child's render(), lifecycle methods, or
// constructors. It does NOT catch: async errors, event handlers, or
// errors inside the ErrorBoundary itself.

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you would send this to a crash-reporting service
    // e.g. Sentry.captureException(error, { extra: info })
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View className="flex-1 bg-surface-alt items-center justify-center px-8">
        <AlertTriangle color="#DC2626" size={48} />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          Something went wrong
        </Text>
        <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </Text>
        <Pressable
          className="mt-6 bg-brand px-8 py-3 rounded-xl active:opacity-80"
          onPress={this.handleRetry}
        >
          <Text className="text-white font-semibold text-base">Try Again</Text>
        </Pressable>
      </View>
    );
  }
}
