"use client"

import { motion } from "framer-motion"

export function SectionHeading({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mx-auto mb-16 max-w-2xl text-center"
    >
      <span className="mb-4 inline-block rounded-full border border-accent-500/20 bg-accent-500/10 px-3 py-1 text-xs font-medium tracking-wider text-accent-400 uppercase">
        {label}
      </span>
      <h2 className="text-3xl font-bold tracking-tight text-surface-50 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-surface-400">
          {description}
        </p>
      )}
    </motion.div>
  )
}
