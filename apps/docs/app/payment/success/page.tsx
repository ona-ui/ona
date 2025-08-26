"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'
import { apiRequest } from '@/lib/query-client'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    if (sessionId) {
      const verifyPayment = async () => {
        try {
          // Appel API pour vérifier le paiement côté serveur
          const result = await apiRequest<{
            success: boolean
            data: {
              verified: boolean
              status: string
              paymentStatus?: string
              sessionStatus?: string
            }
          }>(`/api/public/payment/verify?session_id=${sessionId}`)
          
          // Vérification du résultat
          if (result.success && result.data.verified) {
            setVerificationStatus('success')
          } else {
            console.error('Paiement non vérifié:', result.data)
            setVerificationStatus('error')
          }
          
          setIsVerifying(false)
        } catch (error) {
          console.error('Erreur de vérification:', error)
          setVerificationStatus('error')
          setIsVerifying(false)
        }
      }

      verifyPayment()
    } else {
      setVerificationStatus('error')
      setIsVerifying(false)
    }
  }, [sessionId])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FAF3E0] rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Vérification du paiement...
          </h1>
          <p className="text-gray-600">
            Nous vérifions votre paiement, veuillez patienter.
          </p>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FAF3E0] rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Erreur de vérification
          </h1>
          <p className="text-gray-600 mb-6">
            Nous n'avons pas pu vérifier votre paiement. Veuillez contacter le support.
          </p>
          <Link href="/pricing">
            <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
              Retour au pricing
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#FAF3E0] rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Paiement réussi ! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Votre licence premium Ona UI est maintenant active. Vous avez accès à tous nos composants premium.
        </p>

        {/* Features List */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Ce qui vous attend :</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              200+ composants premium haute conversion
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              Intégrations pré-configurées (Stripe, Supabase, etc.)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              Code source complet et personnalisable
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              Mises à jour à vie incluses
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white group">
              Accéder à mon compte premium
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full">
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        {/* Session Info */}
        {sessionId && (
          <p className="text-xs text-gray-400 mt-4">
            Session ID: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FAF3E0] rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Chargement...
          </h1>
          <p className="text-gray-600">
            Veuillez patienter.
          </p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}