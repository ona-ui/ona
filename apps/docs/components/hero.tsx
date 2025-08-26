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
    <div className="min-h-screen bg-[#FAF3E0] relative pt-4 overflow-hidden">
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
      
      <div className="relative px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center min-h-[80vh]">
            
            {/* Left side - Content */}
            <motion.div 
              className="lg:pr-8 flex-[2]"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Badge with accent color */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-[#FAF3E0]/80 backdrop-blur-sm rounded-full border shadow-sm mb-12"
                style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#C96342'}}></div>
                React & Tailwind available !
              </motion.div>

              {/* TITRE classique avec effet original */}
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-zinc-800 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.3)] tracking-[-0.5px] md:tracking-[-1px] leading-tight text-left">
                  <motion.span
                    className=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    Finally. Landing Pages That Don't Look Like 
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    {" "}They Were Made By{" "}
                    </motion.span>
                  <motion.span 
                    className="relative mx-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium shadow-sm border border-amber-200/50"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    style={{ display: 'inline-block', marginTop: '0.5rem' }}
                  >
                    <WordSwitcher
                      words={["ChatGPT", "Claude", "V0", "Gemini"]}
                      interval={2500}
                    />
                  </motion.span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                className="text-lg text-slate-600 mb-12 leading-relaxed text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Premium components extracted from $10M+ companies.
                <br />
                <strong className="text-slate-900 font-semibold">Because your startup deserves better than generic AI code.</strong>
              </motion.p>

              {/* CTA Buttons avec orange */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 items-start"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Button 
                  size="lg"
                  onClick={() => router.push('/docs')}
                  className="group relative text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-[#C96342] to-[#B55638] hover:from-[#B55638] hover:to-[#A14D2F] shadow-lg hover:shadow-xl hover:shadow-orange-500/25"
                >
                  Browse Blocks
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
               
              </motion.div>
            </motion.div>
            {/* Right side - Infinite Scroll Images */}
            <motion.div
              className="lg:pl-8 flex-[2]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <div className="relative">
                <motion.div
                  className="aspect-[5/6] rounded-2xl overflow-hidden relative"
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
                        <div key={`first-${index}`} className="w-full h-[120%] flex-shrink-0 p-6">
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
                        <div key={`second-${index}`} className="w-full h-[120%] flex-shrink-0 p-6">
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
                        <div key={`first-mobile-${index}`} className="w-[120%] h-full flex-shrink-0 p-6">
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
                        <div key={`second-mobile-${index}`} className="w-[120%] h-full flex-shrink-0 p-6">
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
              `}</style>
            </motion.div>

          </div>
        </div>
      </div>
      
      {/* Transition fluide vers la section suivante */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-amber-50/30 to-amber-50/60 pointer-events-none"></div>
    </div>
  )
}