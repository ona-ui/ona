"use client"

import { ArrowRight, Star, Users, Zap, Check, Code2, Sparkles } from 'lucide-react'
import Aurora from './aurora-background'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@workspace/ui/components/button'
import WordSwitcher from './word-switcher'
import LightRays from './aurora-background'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Hero() {

   // Images pour le défilement automatique

   const router = useRouter();

  const images = [
    {
      src: "/image1.png",
      alt: "Hero Background 1"
    },
    {
      src: "/image2.png",
      alt: "Hero Background 2"
    },
    {
      src: "/image3.png",
      alt: "Hero Dashboard 3"
    },
    {
      src: "/image4.png",
      alt: "Dashboard Image 4"
    }
  ]
  return (
    <div className="min-h-screen bg-[#FAF3E0] relative pt-20 sm:pt-24 lg:pt-20 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundSize: '24px 24px'
      }}></div>
      
      {/* Aurora Background */}
      <div className="absolute inset-0 overflow-hidden">
  <LightRays
    raysOrigin="top-center"
    raysColor="#ffbf47"
    raysSpeed={3.5}
    lightSpread={0.5}
    rayLength={0.6}
    followMouse={true}
    mouseInfluence={0.1}
    noiseAmount={0.8}
    distortion={0.05}
    className="custom-rays"
  />
      </div>
      
      <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-12 items-start min-h-[40vh] sm:min-h-[50vh] lg:min-h-[60vh]">
            
            {/* Left side - Content */}
            <motion.div
              className="w-full lg:pr-8 lg:flex-[2]"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* TITRE classique avec effet original */}
              <motion.div
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-zinc-800 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.3)] tracking-[-0.5px] md:tracking-[-1px] leading-tight text-left">
                  <motion.span
                    className=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    React Components That Don't Look Like Everyone
                  </motion.span>
                  <br />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    Else's{" "}
                    </motion.span>
                  <motion.span
                    className="relative mx-1 sm:mx-2 px-2 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium shadow-sm border border-amber-200/50 text-sm sm:text-base"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    style={{ display: 'inline-block', marginTop: '0.25rem', marginBottom: '0.25rem' }}
                  >
                    <WordSwitcher
                      words={["ChatGPT", "Claude", "V0", "Gemini"]}
                      interval={2500}
                    />
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                  >
                    {" "}Site
                  </motion.span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Copy-paste ready. Tailwind styled. Actually convert.
                <br />
                <strong className="text-slate-900 font-semibold">Ship unique apps while competitors use generic AI designs.</strong>
              </motion.p>

              {/* Component Types Badges - Infinite Scroll */}
              <motion.div
                className="mb-4 sm:mb-6 overflow-hidden max-w-full sm:max-w-lg lg:max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div className="relative mb-3 overflow-hidden">
                  <div
                    className="flex gap-3 whitespace-nowrap"
                    style={{
                      animation: 'scroll-left 30s linear infinite'
                    }}
                  >
                    {[
                      "Hero sections",
                      "Pricing tables",
                      "Navigation",
                      "Features",
                      "CTAs",
                      "Forms",
                      "Testimonials",
                      "FAQ sections",
                      "Contact forms",
                      "Footer",
                      "About sections",
                      "Team cards",
                      "Blog layouts",
                      "Product cards",
                      "Stats sections",
                      "Hero sections",
                      "Pricing tables",
                      "Navigation",
                      "Features",
                      "CTAs",
                      "Forms",
                      "Testimonials",
                      "FAQ sections",
                      "Contact forms",
                      "Footer",
                      "About sections",
                      "Team cards",
                      "Blog layouts",
                      "Product cards",
                      "Stats sections"
                    ].map((item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white/60 backdrop-blur-sm rounded-lg border border-dashed border-slate-300 shadow-sm flex-shrink-0"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  All battle-tested. All production-ready. All impossible for AI to generate.
                </p>
              </motion.div>

              {/* CTA Buttons avec orange */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start mb-6 sm:mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/docs')}
                  className="group relative text-white px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 bg-gradient-to-r from-[#C96342] to-[#B55638] hover:from-[#B55638] hover:to-[#A14D2F] shadow-lg hover:shadow-xl hover:shadow-orange-500/25 w-full sm:w-auto"
                >
                  Browse 40 components
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:rotate-45 transition-all duration-300" />
                </Button>
              </motion.div>

              {/* Trust Bar */}
              <motion.div
                className="flex flex-wrap gap-3 sm:gap-4 text-xs text-slate-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                {[
                  "Copy-paste ready",
                  "Tailwind + React",
                  "From real startups",
                  "Lifetime updates"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            {/* Right side - Infinite Scroll Images */}
            <motion.div
              className="w-full mt-8 sm:mt-10 lg:mt-0 lg:pl-8 lg:flex-[2]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <div className="relative">
                <motion.div
                  className="aspect-[4/5] sm:aspect-[5/6] rounded-2xl overflow-hidden relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Container pour le défilement infini */}
                  <div className="relative h-full overflow-hidden">
                    {/* Desktop - Défilement vertical */}
                    <div className="hidden md:block animate-infinite-scroll-vertical flex flex-col">
                      {/* Premier cycle d'images */}
                      {images.map((image, index) => (
                        <div key={`first-${index}`} className="w-full h-[120%] flex-shrink-0 p-4 sm:p-6">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={600}
                            height={600}
                            className="object-contain w-full h-full"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                      {/* Deuxième cycle d'images pour la continuité */}
                      {images.map((image, index) => (
                        <div key={`second-${index}`} className="w-full h-[120%] flex-shrink-0 p-4 sm:p-6">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={600}
                            height={600}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Mobile - Défilement horizontal */}
                    <div className="md:hidden animate-infinite-scroll-horizontal flex flex-row">
                      {/* Premier cycle d'images */}
                      {images.map((image, index) => (
                        <div key={`first-mobile-${index}`} className="w-[120%] h-full flex-shrink-0 p-3 sm:p-6">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={600}
                            height={600}
                            className="object-contain w-full h-full"
                            priority={index === 0}
                          />
                        </div>
                      ))}
                      {/* Deuxième cycle d'images pour la continuité */}
                      {images.map((image, index) => (
                        <div key={`second-mobile-${index}`} className="w-[120%] h-full flex-shrink-0 p-3 sm:p-6">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            width={600}
                            height={600}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </motion.div>
              </div>
              
              {/* Style pour l'animation */}
              <style jsx>{`
                @keyframes infinite-scroll-vertical {
                  0% {
                    transform: translateY(0);
                  }
                  100% {
                    transform: translateY(-50%);
                  }
                }
                
                @keyframes infinite-scroll-horizontal {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }
                
                .animate-infinite-scroll-vertical {
                  animation: infinite-scroll-vertical 16s linear infinite;
                }
                
                .animate-infinite-scroll-horizontal {
                  animation: infinite-scroll-horizontal 4s linear infinite;
                }
                
                @keyframes scroll-left {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }
              `}</style>
            </motion.div>

          </div>
        </div>
      </div>
      
      {/* Transition fluide vers la section suivante */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 lg:h-40 bg-gradient-to-b from-transparent via-amber-50/30 to-amber-50/60 pointer-events-none"></div>
    </div>
  )
}