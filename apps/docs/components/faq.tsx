"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

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
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="bg-[#FAF3E0] relative py-20">
      {/* Effet de transition subtil depuis le Hero */}
      <div className="absolute top-0 left-0 right-0 h-32 to-white pointer-events-none"></div>

      
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          
          {/* Header Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-[#FAF3E0]/80 backdrop-blur-sm rounded-full border shadow-sm mb-6"
              style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#C96342'}}></div>
              FAQ
            </motion.div>

            <motion.h2
              className="text-2xl md:text-3xl font-bold text-zinc-800 mb-3 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Questions About Using This With{" "}
              <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-2 py-1 rounded-lg border border-amber-200/50">
                AI Tools
              </span>
            </motion.h2>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
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
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
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

        </div>
      </div>
      
      {/* Styles CSS personnalisés */}
      <style jsx>{`
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}