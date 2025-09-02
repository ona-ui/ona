"use client"

import { ArrowRight, Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import LightRays from './aurora-background'

export default function Footer() {
  return (
    <footer className="bg-[#F1F0EE] relative overflow-hidden border-t border-slate-200/50">

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
                <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-[#F1F0EE]/80 backdrop-blur-sm rounded-full border shadow-sm mb-4" 
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
                    { icon: Linkedin, href: 'https://linkedin.com/company/ona-ui', label: 'LinkedIn' },
                    {
                      icon: () => (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                        </svg>
                      ),
                      href: 'https://discord.gg/XzsMz8BjbV',
                      label: 'Discord'
                    }
                  ].map(({ icon: Icon, href, label }) => (
                    <motion.a
                      key={label}
                      href={href}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-[#F1F0EE]/50 backdrop-blur-sm rounded-lg border border-slate-200/50 hover:border-orange-200 hover:bg-orange-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
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