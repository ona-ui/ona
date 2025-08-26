"use client"

import { Check, ArrowRight, Loader2, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@workspace/ui/components/button'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function Pricing() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  const PUBLIC_PRODUCT_ID = 'pro'

  const faqItems: FAQItem[] = [
    {
      question: "How is this different from v0, ChatGPT, or Claude Artifacts?",
      answer: "AI tools generate generic components from training data everyone has seen. We provide premium components from successful startups that aren't in training datasets. Plus, ours are optimization-tested, not just pretty."
    },
    {
      question: "Can I use these with Cursor/Copilot?",
      answer: "Absolutely! In fact, that's the recommended workflow. Use AI for logic, our components for UI. They're designed to be AI-friendly for customization."
    },
    {
      question: "Won't AI eventually learn these designs?",
      answer: "We ship 20+ new components weekly from emerging successful startups. By the time AI models train on current designs, we're already ahead. Plus, AI can't capture the conversion optimizations we build in."
    },
    {
      question: "Is this worth it if I already have ChatGPT Pro?",
      answer: "100%. ChatGPT is great for many things, but it generates the same Hero section everyone else gets. Our components make you stand out. Use both: AI for speed, our components for uniqueness."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const handleGetAccess = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const successUrl = `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${window.location.origin}/pricing`

      const response = await fetch('http://localhost:3333/api/public/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicId: PUBLIC_PRODUCT_ID,
          successUrl,
          cancelUrl,
          metadata: {
            source: 'pricing_page',
            product: 'lifetime_license'
          }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erreur lors de la création de la session de paiement')
      }

      if (result.success && result.data?.url) {
        window.location.href = result.data.url
      } else {
        throw new Error('URL de redirection manquante')
      }
    } catch (err) {
      console.error('Erreur de paiement:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#FAF3E0] relative pt-32 pb-20">
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-3xl md:text-4xl font-bold text-zinc-800 mb-2 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Invest in Standing Out.
            </motion.h1>
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-zinc-800 mb-8 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-3 py-1 rounded-lg border border-amber-200/50">
                Not Another AI Clone.
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-slate-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Unlock access to all blocks, sections, and templates.<br />
              Including all future updates — yours forever with a single payment.
            </motion.p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-orange-200 rounded-3xl p-2 shadow-lg"
            >
              <div className="bg-[#FAF3E0] rounded-2xl p-8 h-full border border-amber-200 shadow-sm">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-slate-600 bg-orange-200 rounded-full mb-4">
                    FREE PLAN
                  </div>
                  <div className="flex items-baseline justify-center gap-2 mb-3">
                    <span className="text-4xl font-bold text-zinc-800">$0</span>
                    <span className="text-slate-500">Forever</span>
                  </div>
                  <p className="text-slate-600">Perfect if you want to try it out</p>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    "Access to 15+ free sections",
                    "Full previews and interactive playground", 
                    "CLI setup (coming soon)",
                    "Open-source site & docs"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-100">
                        <Check className="w-3 h-3 text-orange-400" />
                      </div>
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full text-slate-700 px-6 py-3 rounded-xl font-semibold bg-[#FAF3E0] border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                >
                  Start for free
                </Button>
              </div>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-2 shadow-2xl relative overflow-hidden"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#C96342] to-[#E8915B] rounded-3xl opacity-20"></div>
              
              <div className="bg-zinc-800 rounded-2xl p-8 h-full relative shadow-xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30 mb-4">
                    LIFETIME LICENSE
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">One-time payment, lifetime access</h3>
                  <div className="flex items-baseline justify-center gap-3 mb-3">
                    <span className="text-5xl font-bold text-white">$39</span>
                    <div className="flex flex-col">
                      <span className="text-xl text-slate-400 line-through">$79</span>
                      <span className="text-sm text-green-400 font-medium">Early bird</span>
                    </div>
                  </div>
                  <p className="text-slate-300">Best for developers and startups</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white">Unlock 25+ sections, ready-to-use</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white">
                      <strong className="text-orange-300">1x free 'page roast' review</strong> - Personal feedback on your landing page
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-200">Access to all future updates - forever</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-200">Priority support for integration issues</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-200">Early access to CLI integration</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                      HOT
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-slate-200">Early access to AI-agent (MCP) support</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                      HOT
                    </span>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-6">
                  <p className="text-sm text-amber-300 text-center">
                    ⚠️ Price increases with each new section. Today: $39.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleGetAccess}
                  disabled={isLoading}
                  className="w-full group text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-[#C96342] to-[#E8915B] hover:from-[#B55638] hover:to-[#D7824F] shadow-lg hover:shadow-xl hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Join the cult for life
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-sm text-slate-400 text-center">
                  30-day money-back guarantee • Instant access
                </p>
              </div>
            </motion.div>

          </div>

          {/* FAQ Section */}
          <motion.div
            className="mt-24 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <div className="text-center mb-12">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-[#FAF3E0]/80 backdrop-blur-sm rounded-full border shadow-sm mb-6"
                style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#C96342'}}></div>
                 FAQ
              </motion.div>

              <motion.h2
                className="text-2xl md:text-3xl font-bold text-zinc-800 mb-3 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                Questions About Using This With{" "}
                <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-2 py-1 rounded-lg border border-amber-200/50">
                  AI Tools
                </span>
              </motion.h2>
            </div>

            <div className="space-y-2">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.3 + index * 0.1 }}
                  className="border border-slate-200/50 rounded-xl bg-[#FAF3E0]/50 backdrop-blur-sm hover:bg-[#FAF3E0]/80 transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50/30 transition-colors duration-200 rounded-xl"
                  >
                    <h3 className="text-base font-medium text-zinc-800 pr-4">
                      {item.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openFAQ === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openFAQ === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
