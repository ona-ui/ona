"use client";

import { useState } from "react";
import { signInWithMagicLink } from "@/lib/auth-client";

interface MagicLinkFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  callbackURL?: string;
  newUserCallbackURL?: string;
  errorCallbackURL?: string;
}

export function MagicLinkForm({
  onSuccess,
  onError,
  callbackURL,
  newUserCallbackURL,
  errorCallbackURL
}: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      onError?.("L'adresse email est requise");
      return;
    }

    setIsLoading(true);
    
    try {
      await signInWithMagicLink({
        email,
        name: name || undefined,
        callbackURL,
        newUserCallbackURL,
        errorCallbackURL
      });
      
      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'envoi du magic link:", error);
      onError?.(
        error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de l'envoi du lien"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto p-8 bg-[#F1F0EE]/80 backdrop-blur-sm rounded-3xl shadow-lg border" style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #C96342, #E8915B)'}}>
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 mb-4">
            Email envoyé ! 📧
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Nous avons envoyé un lien de connexion à <strong className="text-slate-900">{email}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Vérifiez votre boîte de réception et cliquez sur le lien pour vous connecter.
            Le lien expire dans 5 minutes.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail("");
              setName("");
            }}
            className="text-sm font-medium transition-colors duration-200 hover:underline"
            style={{color: '#C96342'}}
          >
            Envoyer un autre lien
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-[#F1F0EE]/80 backdrop-blur-sm rounded-3xl shadow-lg border" style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}>
      <div className="text-center mb-8">
        {/* Badge avec accent color */}
        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-[#F1F0EE]/80 backdrop-blur-sm rounded-full border shadow-sm mb-6"
             style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#C96342'}}></div>
          ONA UI
        </div>
        
        <h2 className="text-2xl font-bold text-zinc-800 mb-4">
          Connexion par lien magique ✨
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Entrez votre email pour recevoir un lien de connexion sécurisé
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            Adresse email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
            style={{
              '--tw-ring-color': 'rgba(201, 99, 66, 0.5)',
            } as React.CSSProperties}
            placeholder="votre@email.com"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full flex justify-center items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            background: 'linear-gradient(to right, #C96342, #B55638)',
            boxShadow: isLoading ? undefined : '0 10px 25px rgba(201, 99, 66, 0.25)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && email) {
              e.currentTarget.style.background = 'linear-gradient(to right, #B55638, #A14D2F)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && email) {
              e.currentTarget.style.background = 'linear-gradient(to right, #C96342, #B55638)';
            }
          }}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Envoi en cours...
            </>
          ) : (
            <>
              Envoyer le lien magique
              <span className="text-lg">🔗</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500 leading-relaxed">
          En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}