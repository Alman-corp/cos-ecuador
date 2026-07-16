import { BusinessCaseLibrary } from "@/components/learning/BusinessCaseLibrary"

export default function BibliotecaPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Business Case Library</h1>
        <p className="text-surface-400 mt-1">Registro estructurado de cada proyecto: problema → diagnóstico → plan → resultado → tiempo → costo → rentabilidad → aprendizaje. El patrimonio intelectual de la empresa.</p>
      </div>
      <BusinessCaseLibrary />
    </div>
  )
}
