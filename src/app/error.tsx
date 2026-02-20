"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
            <div className="glass-panel p-8 max-w-lg w-full">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">문제가 발생했습니다.</h2>
                <p className="text-gray-600 mb-6 font-medium">
                    페이지를 불러오는 중 예상치 못한 오류가 발생했습니다.
                </p>

                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-left overflow-auto max-h-48">
                    <p className="text-xs font-mono text-red-800 break-all whitespace-pre-wrap">
                        {error.message || "Unknown error occurred"}
                        {error.digest && `\n\nDigest: ${error.digest}`}
                        {error.stack && `\n\nStack Trace:\n${error.stack}`}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex-1 py-3 px-4 bg-[var(--primary)] text-white font-bold rounded-lg hover:bg-[var(--primary-hover)] transition-all shadow-lg"
                    >
                        다시 시도하기
                    </button>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-all"
                    >
                        홈으로 이동
                    </button>
                </div>
            </div>
        </div>
    );
}
