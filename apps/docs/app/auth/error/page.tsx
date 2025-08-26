"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_token':
        return 'Le lien de connexion est invalide ou incomplet.';
      case 'verification_failed':
        return 'La vérification du lien de connexion a échoué.';
      case 'expired_token':
        return 'Le lien de connexion a expiré. Veuillez en demander un nouveau.';
      case 'invalid_token':
        return 'Le lien de connexion est invalide.';
      case 'access_denied':
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      default:
        return 'Une erreur s\'est produite lors de la connexion.';
    }
  };

  const getErrorTitle = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_token':
      case 'invalid_token':
        return 'Lien invalide';
      case 'expired_token':
        return 'Lien expiré';
      case 'verification_failed':
        return 'Vérification échouée';
      case 'access_denied':
        return 'Accès refusé';
      default:
        return 'Erreur de connexion';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎨 Ona UI
          </h1>
          <p className="text-gray-600">
            Composants premium pour développeurs
          </p>
        </div>

        {/* Error Card */}
        <div className="bg-[#FAF3E0] rounded-lg shadow-lg p-8 border border-red-100">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {getErrorTitle(error)}
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 mb-8">
              {getErrorMessage(error)}
            </p>

            {/* Actions */}
            <div className="space-y-4">
              <Link
                href="/auth/magic-link"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🔗 Demander un nouveau lien
              </Link>
              
              <Link
                href="/"
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-[#FAF3E0] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🏠 Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <div className="bg-[#FAF3E0] rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Besoin d'aide ? 🤔
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Vérifiez que vous utilisez le lien le plus récent</p>
              <p>• Les liens expirent après 5 minutes</p>
              <p>• Assurez-vous d'ouvrir le lien dans le même navigateur</p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>💡 Conseil :</strong> Si le problème persiste, contactez notre support à{' '}
                <a href="mailto:support@ona-ui.com" className="underline hover:text-blue-900">
                  support@ona-ui.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎨 Ona UI
            </h1>
            <p className="text-gray-600">
              Composants premium pour développeurs
            </p>
          </div>
          <div className="bg-[#FAF3E0] rounded-lg shadow-lg p-8 border border-red-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Chargement...
              </h2>
              <p className="text-gray-600">
                Veuillez patienter.
              </p>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}