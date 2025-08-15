import React from 'react'
import { motion } from 'framer-motion'
const Loading = () => {
  return (
        <motion.div className="h-screen w-full flex items-center justify-center dark:bg-gradient-to-br dark:from-[#090e1a] dark:via-[#111827] dark:to-black">
          {Array(3).fill().map((_, index)=>(
            <motion.span className="bg-blue-500 w-20 h-10 rounded-full" key={index} animate={{y: [0, 50, 100, 150, 200, 200, 150, 100, 50, 0, -50, -100, -150, -200, -200, -150, -100, -50, 0,]}} transition={{repeat: Infinity, duration: 2, delay: 0.3*index}}></motion.span>
          ))}
        </motion.div>)
}

export default Loading