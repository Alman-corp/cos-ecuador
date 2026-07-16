import { GenomeViewer } from "@/components/genome/GenomeViewer"

export default function GenomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Enterprise Genome</h1>
        <p className="text-surface-400 mt-1">Perfil empresarial multidimensional. Cada empresa tiene un ADN único que permite comparaciones precisas y recomendaciones personalizadas.</p>
      </div>
      <GenomeViewer />
    </div>
  )
}
