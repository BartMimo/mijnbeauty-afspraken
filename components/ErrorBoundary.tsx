import React from 'react';

export class ErrorBoundaryRoot extends React.Component<{children?: React.ReactNode}, {error?: any}> {
    constructor(props: any) {
        super(props);
        this.state = { error: undefined };
    }

    static getDerivedStateFromError(error: any) {
        return { error };
    }

    componentDidCatch(error: any, info: any) {
        console.error('Root ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.error) {
            const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
            const debug = search.get('debug') === '1';

            return (
                <div className="min-h-screen flex items-center justify-center p-8 bg-red-50 text-red-800">
                    <div className="max-w-xl">
                        <h2 className="font-bold mb-2">Er is iets misgegaan</h2>
                        <p className="mb-4">De pagina kan niet worden weergegeven door een interne fout. Probeer te herladen of neem contact op.</p>
                        {debug && (
                            <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded border">{String(this.state.error?.stack || this.state.error)}</pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children as React.ReactElement;
    }
}
