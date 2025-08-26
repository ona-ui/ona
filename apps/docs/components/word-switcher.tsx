"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface WordSwitcherProps {
  words?: string[]
  interval?: number
  className?: string
  style?: React.CSSProperties
}

export default function WordSwitcher({
  words = ["Claude", "V0", "Gemini", "ChatGPT"],
  interval = 2000,
  className = "",
  style
}: WordSwitcherProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (words.length === 0) return
    
    const currentWord = words[currentIndex] || words[0]
    if (!currentWord) return
    
    let timeout: NodeJS.Timeout

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, 50)
      } else {
        setIsDeleting(false)
        setCurrentIndex((prev) => (prev + 1) % words.length)
      }
    } else {
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1))
        }, 80)
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true)
        }, interval)
      }
    }

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentIndex, words, interval])

  return (
    <motion.span
      className={className}
      style={style}
      animate={{
        filter: isDeleting ? "blur(3px)" : "blur(0px)",
        opacity: isDeleting ? 0.7 : 1
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {displayText || '\u00A0'}
    </motion.span>
  )
}