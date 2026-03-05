'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
    this.handleReload = this.handleReload.bind(this)
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  public handleReload(): void {
    this.setState({ hasError: false })
    window.location.reload()
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
            <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We hit an unexpected error. Please try reloading the app.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
