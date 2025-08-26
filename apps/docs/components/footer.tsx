"use client"

import { ArrowRight, Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import LightRays from './aurora-background'

export default function Footer() {
  return (
    <footer className="bg-[#FAF3E0] relative overflow-hidden border-t border-slate-200/50">

      <div className="relative px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Main Footer Content */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            
            {/* Brand Column */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-[#FAF3E0]/80 backdrop-blur-sm rounded-full border shadow-sm mb-4" 
                     style={{borderColor: 'rgba(201, 99, 66, 0.3)'}}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#C96342'}}></div>
                  ONA UI
                </div>
                <h3 className="text-2xl font-bold text-zinc-800 mb-4">
                  Building the future of 
                  <span className="relative mx-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium shadow-sm border border-amber-200/50">
                    components
                  </span>
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  The first component library built from analyzing 1,000+ high-converting pages. 
                  Stop coding the same sections. Start shipping faster.
                </p>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { name: 'Browse Components', href: '/docs', available: true },
                  { name: 'Documentation', href: '/docs', available: true },
                  { name: 'Templates', href: '#', available: false },
                  { name: 'Pricing', href: '/pricing', available: true }
                ].map(({ name, href, available }) => (
                  <li key={name}>
                    <motion.div
                      className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center gap-2 group"
                      whileHover={available ? { x: 4 } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      {available ? (
                        <Link href={href} className="flex items-center gap-2 group">
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {name}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 cursor-not-allowed opacity-60">
                          <ArrowRight className="w-3 h-3 opacity-0" />
                          {name}
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Soon
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Connect */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4">
                Connect
              </h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  {[
                    { icon: Github, href: 'https://github.com/ona-ui', label: 'GitHub' },
                    { icon: Twitter, href: 'https://twitter.com/ona_ui', label: 'Twitter' },
                    { icon: Linkedin, href: 'https://linkedin.com/company/ona-ui', label: 'LinkedIn' }
                  ].map(({ icon: Icon, href, label }) => (
                    <motion.a
                      key={label}
                      href={href}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-[#FAF3E0]/50 backdrop-blur-sm rounded-lg border border-slate-200/50 hover:border-orange-200 hover:bg-orange-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={label}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  hello@ona-ui.com
                </div>
              </div>
            </motion.div>

          </motion.div>

          {/* Bottom Section */}
          <motion.div 
            className="pt-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <span>© 2025 ONA UI. Made with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </motion.div>
              <span>for developers</span>
            </div>
            
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Privacy Policy</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  Soon
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Terms of Service</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  Soon
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </footer>
  )
}