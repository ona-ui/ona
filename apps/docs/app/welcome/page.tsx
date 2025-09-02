"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function WelcomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error getting user session:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎨 Ona UI
          </h1>
          <p className="text-gray-600">
            Composants premium pour développeurs
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-[#F1F0EE] rounded-lg shadow-lg p-8 border border-green-100">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Welcome Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenue{user?.name ? ` ${user.name}` : ''} ! 🎉
            </h2>

            {/* Welcome Message */}
            <p className="text-lg text-gray-600 mb-8">
              Votre compte premium Ona UI est maintenant actif ! Vous avez accès à tous nos composants premium et intégrations.
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                <div className="text-2xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">200+ Composants Premium</h3>
                <p className="text-sm text-gray-600">Composants haute conversion extraits de startups à succès</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">Intégrations Pré-configurées</h3>
                <p className="text-sm text-gray-600">Stripe, Supabase, Posthog et plus encore</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-100">
                <div className="text-2xl mb-3">🔧</div>
                <h3 className="font-semibold text-gray-900 mb-2">Code Source Complet</h3>
                <p className="text-sm text-gray-600">Personnalisable et adaptable à vos besoins</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-100">
                <div className="text-2xl mb-3">🚀</div>
                <h3 className="font-semibold text-gray-900 mb-2">Support Prioritaire</h3>
                <p className="text-sm text-gray-600">Aide directe de notre équipe de développement</p>
              </div>
            </div>

          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8">
          <div className="bg-[#F1F0EE] rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              🚀 Prochaines étapes recommandées
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">1</span>
                <p>Explorez notre bibliothèque de composants premium dans le dashboard</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">2</span>
                <p>Consultez la documentation pour apprendre à intégrer les composants</p>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">3</span>
                <p>Rejoignez notre communauté Discord pour échanger avec d'autres développeurs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Des questions ? {" "}
            <a href="mailto:support@ona-ui.com" className="text-blue-600 hover:text-blue-800 underline">
              Contactez notre support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}