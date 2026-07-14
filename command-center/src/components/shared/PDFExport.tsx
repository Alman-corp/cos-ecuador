"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface PDFSection {
  title: string
  content: string
}

interface Props {
  title?: string
  subtitle?: string
  sections: PDFSection[]
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function PDFExport({ title = "Reporte Ejecutivo", subtitle = "COS Platform", sections }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const sectionsHTML = sections
      .map(
        (s) => `
      <div class="section">
        <h2>${escapeHTML(s.title)}</h2>
        <p>${escapeHTML(s.content).replace(/\n/g, "<br/>")}</p>
      </div>
    `
      )
      .join("")

    printWindow.document.write(`
      <html>
      <head>
        <title>${escapeHTML(title)} - ${escapeHTML(subtitle)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
          }
          .header { margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .header h1 { font-size: 28px; font-weight: 700; color: #0f172a; }
          .header .sub { font-size: 14px; color: #64748b; margin-top: 4px; }
          .header .date { font-size: 12px; color: #94a3b8; margin-top: 8px; }
          .section { margin-bottom: 24px; }
          .section h2 { font-size: 16px; font-weight: 600; color: #2563eb; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
          .section p { font-size: 13px; line-height: 1.6; color: #334155; font-family: 'JetBrains Mono', monospace; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHTML(title)}</h1>
          <p class="sub">${escapeHTML(subtitle)}</p>
          <p class="date">Generado el ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        ${sectionsHTML}
        <div class="footer">
          <p>COS Platform — Consulting Operating System</p>
          <p>Documento generado automáticamente · Confidencial</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-700 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Exportar
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-surface-700 bg-surface-800 p-4 shadow-xl"
          >
            <p className="mb-3 text-xs font-medium text-surface-200">Exportar reporte ejecutivo</p>
            <p className="mb-3 text-[10px] text-surface-500 leading-relaxed">
              Se generará un PDF imprimible con {sections.length} secciones basadas en los datos actuales.
            </p>
            <div className="space-y-1.5 mb-3">
              {sections.map((s) => (
                <div key={s.title} className="flex items-center gap-2 text-[10px] text-surface-400">
                  <span className="h-1 w-1 rounded-full bg-accent-500" />
                  {s.title}
                </div>
              ))}
            </div>
            <button
              onClick={handlePrint}
              className="w-full rounded-lg bg-accent-600 py-2 text-xs font-semibold text-white hover:bg-accent-500 transition-colors"
            >
              Descargar / Imprimir PDF
            </button>
            <button
              onClick={() => setOpen(false)}
              className="mt-1.5 w-full rounded-lg py-1.5 text-[10px] text-surface-500 hover:text-surface-300 transition-colors"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
