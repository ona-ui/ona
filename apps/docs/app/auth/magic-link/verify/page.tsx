"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function MagicLinkVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      const callbackURL = searchParams.get('callbackURL');
      
      console.log('🔍 [MAGIC LINK DEBUG] Début de la vérification:', { token: token?.substring(0, 8) + '...', callbackURL });
      
      if (!token) {
        console.error('❌ [MAGIC LINK DEBUG] Token manquant dans l\'URL');
        setStatus('error');
        setMessage('Token manquant dans l\'URL');
        return;
      }

      try {
        console.log('🔍 [MAGIC LINK DEBUG] Appel API Better Auth...');
        
        // Appel fetch vers l'endpoint Better Auth avec GET
        const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
        const verifyURL = new URL(`${baseURL}/api/auth/magic-link/verify`);
        verifyURL.searchParams.set('token', token);
        if (callbackURL) {
          verifyURL.searchParams.set('callbackURL', callbackURL);
        }

        console.log('🔍 [MAGIC LINK DEBUG] Appel vers:', verifyURL.toString());
        
        // Faire un fetch au lieu d'une redirection pour traiter la réponse
        const response = await fetch(verifyURL.toString(), {
          method: 'GET',
          credentials: 'include', // Important pour les cookies
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [MAGIC LINK DEBUG] Vérification réussie:', result);
          
          setStatus('success');
          setMessage('Connexion réussie ! Redirection en cours...');
          
          // Rediriger vers le dashboard après un délai
          setTimeout(() => {
            router.push(callbackURL || '/dashboard');
          }, 2000);
        } else {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
      } catch (error) {
        console.error('❌ [MAGIC LINK DEBUG] Échec de la vérification:', error);
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la vérification'
        );
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#F1F0EE] relative overflow-hidden flex items-center justify-center p-4">
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
            Vérification du lien magique
          </p>
        </div>

        {/* Contenu principal */}
        <div className="max-w-md mx-auto p-8 bg-[#F1F0EE]/80 backdrop-blur-sm rounded-3xl shadow-lg border" style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}>
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #C96342, #E8915B)'}}>
                  <svg
                    className="w-8 h-8 text-white animate-spin"
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
                </div>
                <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                  Vérification en cours... ⏳
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Nous vérifions votre lien de connexion, veuillez patienter.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #10B981, #059669)'}}>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                  Connexion réussie ! ✅
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {message}
                </p>
                <div className="flex items-center justify-center">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #EF4444, #DC2626)'}}>
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                  Erreur de vérification ❌
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {message}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/auth/magic-link')}
                    className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(to right, #C96342, #B55638)',
                      boxShadow: '0 10px 25px rgba(201, 99, 66, 0.25)'
                    }}
                  >
                    Demander un nouveau lien
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full px-6 py-3 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

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

export default function MagicLinkVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F1F0EE] relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0" style={{
          backgroundSize: '24px 24px'
        }}></div>

        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 191, 71, 0.1) 0%, transparent 50%)'
          }}></div>
        </div>

        <div className="w-full max-w-lg relative">
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
              Vérification du lien magique
            </p>
          </div>

          <div className="max-w-md mx-auto p-8 bg-[#F1F0EE]/80 backdrop-blur-sm rounded-3xl shadow-lg border" style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #C96342, #E8915B)'}}>
                <svg
                  className="w-8 h-8 text-white animate-spin"
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
              </div>
              <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                Chargement...
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Veuillez patienter.
              </p>
            </div>
          </div>
        </div>
      </div>
    }>
      <MagicLinkVerifyContent />
    </Suspense>
  )
}