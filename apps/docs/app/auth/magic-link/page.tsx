"use client";

import { useState } from "react";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export default function MagicLinkPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSuccess = () => {
    setMessage({
      type: 'success',
      text: 'Lien magique envoyé avec succès ! Vérifiez votre boîte de réception.'
    });
  };

  const handleError = (error: string) => {
    setMessage({
      type: 'error',
      text: error
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF3E0] relative overflow-hidden flex items-center justify-center p-4">
      {/* Grid background like hero */}
      <div className="absolute inset-0" style={{
        backgroundSize: '24px 24px'
      }}></div>
      
      {/* Aurora Background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 191, 71, 0.1) 0%, transparent 50%)'
        }}></div>
      </div>

      <div className="w-full max-w-lg relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #C96342, #E8915B)'}}>
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-800">
              ONA<span style={{color: '#C96342'}}>UI</span>
            </h1>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Composants premium pour développeurs
          </p>
        </div>

        {/* Message d'alerte */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl backdrop-blur-sm border shadow-sm ${
            message.type === 'success'
              ? 'bg-green-50/80 border-green-200/50 text-green-800'
              : 'bg-red-50/80 border-red-200/50 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage(null)}
                  className="inline-flex text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire Magic Link */}
        <MagicLinkForm
          onSuccess={handleSuccess}
          onError={handleError}
          callbackURL="/dashboard"
          newUserCallbackURL="/welcome"
          errorCallbackURL="/auth/error"
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p className="leading-relaxed">
            Vous avez des questions ? {" "}
            <a href="mailto:support@ona-ui.com" className="font-medium transition-colors duration-200 hover:underline" style={{color: '#C96342'}}>
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}