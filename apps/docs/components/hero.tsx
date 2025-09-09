"use client"

import { ArrowRight, Star, Users, Zap, Check, Code2, Sparkles } from 'lucide-react'
import Aurora from './aurora-background'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@workspace/ui/components/button'
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
    <div className="min-h-screen bg-gradient-to-br from-[#F8F7F5] via-[#F1F0EE] to-[#EFEDE8] relative pt-32 sm:pt-36 lg:pt-32 overflow-hidden">
      {/* Premium Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 25px 25px, rgba(200, 200, 200, 0.15) 2px, transparent 2px),
          linear-gradient(0deg, transparent 24px, rgba(255, 255, 255, 0.1) 25px, rgba(255, 255, 255, 0.1) 26px, transparent 27px, transparent 74px, rgba(255, 255, 255, 0.1) 75px, rgba(255, 255, 255, 0.1) 76px, transparent 77px, transparent)
        `,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Premium Aurora Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-orange-200/20 via-amber-200/30 to-yellow-200/20 rounded-full blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute top-20 left-1/4 w-[600px] h-[300px] bg-gradient-to-r from-blue-200/15 via-purple-200/25 to-pink-200/15 rounded-full blur-3xl opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-40 right-1/4 w-[400px] h-[200px] bg-gradient-to-r from-green-200/10 via-emerald-200/20 to-teal-200/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      </div>
      
      <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] relative">
            
            {/* Centered Content */}
            <motion.div
              className="w-full max-w-4xl z-10 relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* TITRE classique avec effet original */}
              <motion.div
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-zinc-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)] tracking-[-0.5px] md:tracking-[-2px] leading-[0.95] text-center bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
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
                    className="relative mx-2 sm:mx-4 px-6 py-4 sm:px-10 sm:py-4 rounded-2xl bg-gradient-to-br text-slate-800 font-black shadow-xl text-xl sm:text-4xl md:text-4xl backdrop-blur-md transform perspective-1000"
                    initial={{ opacity: 0, scale: 0.8, rotateY: 0 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 8 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    style={{ 
                      display: 'inline-block', 
                      marginTop: '0.5rem', 
                      marginBottom: '0.5rem',
                      transformStyle: 'preserve-3d',
                      boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(148, 163, 184, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      rotateY: 4, 
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(148, 163, 184, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)' 
                    }}
                  >
                    <span className="inline-block">AI Tools</span>
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
                className="text-xl sm:text-2xl md:text-3xl text-slate-700 mb-10 sm:mb-16 leading-relaxed text-center max-w-4xl mx-auto font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <span className="text-slate-600">Copy-paste ready. Tailwind styled. Actually convert.</span>
                <br />
                <strong className="text-slate-900 font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">Ship unique apps while competitors use generic AI designs.</strong>
              </motion.p>


              {/* CTA Buttons avec orange */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center mb-8 sm:mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/docs')}
                  className="group relative text-white px-8 py-4 sm:px-12 sm:py-6 rounded-xl cursor-pointer text-lg sm:text-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 bg-gradient-to-r from-[#C96342] to-[#B55638] hover:from-[#B55638] hover:to-[#A14D2F] shadow-lg hover:shadow-xl hover:shadow-orange-500/25 w-full sm:w-auto"
                >
                  Browse 31 components
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-all duration-300" />
                </Button>
              </motion.div>

              {/* Trust Bar */}
              <motion.div
                className="flex flex-wrap justify-center gap-6 sm:gap-8 text-base text-slate-700"
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
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/40 backdrop-blur-sm shadow-lg border border-white/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Scattered Images with 3D Rotations */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Image 1 - Top Left avec effet 3D */}
              <motion.div
                className="absolute top-8 left-8 sm:top-12 sm:left-12 lg:top-16 lg:left-20"
                initial={{ opacity: 0, scale: 0.7, rotateX: -20, rotateY: -30, rotateZ: -25 }}
                animate={{ opacity: 0.8, scale: 1, rotateX: -15, rotateY: -25, rotateZ: -20 }}
                transition={{ duration: 1.2, delay: 1.2 }}
                whileHover={{ scale: 1.1, rotateX: -10, rotateY: -20, rotateZ: -15, y: -10 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-3xl shadow-2xl bg-white/90 backdrop-blur-md p-3 transform perspective-1000" style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}>
                  <Image
                    src={images[0]?.src || "/placeholder.png"}
                    alt={images[0]?.alt || "Placeholder"}
                    width={250}
                    height={250}
                    className="object-cover w-full h-full rounded-2xl"
                  />
                </div>
              </motion.div>

              {/* Image 2 - Top Right avec rotation extrême */}
              <motion.div
                className="absolute top-6 right-8 sm:top-8 sm:right-12 lg:top-10 lg:right-20"
                initial={{ opacity: 0, scale: 0.8, rotate: 45 }}
                animate={{ opacity: 0.7, scale: 1, rotate: 35 }}
                transition={{ duration: 1, delay: 1.4 }}
                whileHover={{ scale: 1.08, rotate: 25, y: -8 }}
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-3xl shadow-2xl bg-white/85 backdrop-blur-md p-2 transform">
                  <Image
                    src={images[1]?.src || "/placeholder.png"}
                    alt={images[1]?.alt || "Placeholder"}
                    width={220}
                    height={220}
                    className="object-cover w-full h-full rounded-2xl"
                  />
                </div>
              </motion.div>

              {/* Image 3 - Bottom Left avec effet 3D inverse */}
              <motion.div
                className="absolute bottom-20 left-6 sm:bottom-24 sm:left-10 lg:bottom-28 lg:left-16"
                initial={{ opacity: 0, scale: 0.7, rotateX: 25, rotateY: 30, rotateZ: 20 }}
                animate={{ opacity: 0.6, scale: 1, rotateX: 20, rotateY: 25, rotateZ: 15 }}
                transition={{ duration: 1.1, delay: 1.6 }}
                whileHover={{ scale: 1.1, rotateX: 15, rotateY: 20, rotateZ: 10, y: -12 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-md p-2.5 transform perspective-1000">
                  <Image
                    src={images[2]?.src || "/placeholder.png"}
                    alt={images[2]?.alt || "Placeholder"}
                    width={230}
                    height={230}
                    className="object-cover w-full h-full rounded-2xl"
                  />
                </div>
              </motion.div>

              {/* Image 4 - Bottom Right avec rotation dramatique */}
              <motion.div
                className="absolute bottom-16 right-6 sm:bottom-20 sm:right-10 lg:bottom-24 lg:right-16"
                initial={{ opacity: 0, scale: 0.8, rotate: -50 }}
                animate={{ opacity: 0.75, scale: 1, rotate: -35 }}
                transition={{ duration: 1.3, delay: 1.8 }}
                whileHover={{ scale: 1.12, rotate: -25, y: -10 }}
              >
                <div className="w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 rounded-3xl shadow-2xl bg-white/90 backdrop-blur-md p-3 transform" style={{
                  boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                }}>
                  <Image
                    src={images[3]?.src || "/placeholder.png"}
                    alt={images[3]?.alt || "Placeholder"}
                    width={260}
                    height={260}
                    className="object-cover w-full h-full rounded-2xl"
                  />
                </div>
              </motion.div>


              {/* Additional decorative elements */}
              <motion.div
                className="absolute top-1/3 left-1/4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-orange-200/30 to-amber-200/30 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 2 }}
              />
              
              <motion.div
                className="absolute bottom-1/3 right-1/4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-200/20 to-purple-200/20 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 2.2 }}
              />
            </div>

          </div>
        </div>
      </div>
      
    </div>
  )
}