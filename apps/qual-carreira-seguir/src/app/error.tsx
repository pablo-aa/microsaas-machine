"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="mb-2 text-2xl font-bold">Algo deu errado</h1>
            <p className="mb-6 text-gray-600">
              Ocorreu um erro inesperado ao carregar esta página. Tente novamente ou volte para a página inicial.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-md bg-gray-800 text-white text-sm font-medium hover:bg-gray-900"
              >
                Tentar novamente
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Voltar para início
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
