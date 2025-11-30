'use client'

interface AnalysisData {
  gender: string | null
  ageRange: { low: number; high: number } | null
  confidence: number
}

interface AnalysisPanelProps {
  analysisData: AnalysisData
  isAnalyzing: boolean
  onStartAnalysis: () => void
}

export default function AnalysisPanel({ analysisData, isAnalyzing, onStartAnalysis }: AnalysisPanelProps) {
  return (
    <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
      <h3 className="text-white text-lg font-semibold mb-6">Panel de Análisis</h3>
      
      <div className="space-y-6">
        {/* Gender */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-white/80 text-sm mb-2">GÉNERO</div>
          <div className="text-white text-lg font-semibold">
            {analysisData.gender || 'No detectado'}
          </div>
        </div>

        {/* Age Range */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-white/80 text-sm mb-2">RANGO DE EDAD</div>
          <div className="text-white text-lg font-semibold">
            {analysisData.ageRange 
              ? `${analysisData.ageRange.low}-${analysisData.ageRange.high} años`
              : 'No detectado'
            }
          </div>
        </div>

        {/* Confidence Level */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-white/80 text-sm mb-2">NIVEL DE CONFIANZA</div>
          <div className="text-white text-lg font-semibold mb-2">
            {analysisData.confidence.toFixed(1)}%
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${analysisData.confidence}%` }}
            ></div>
          </div>
        </div>

        {/* Analysis Button */}
        <button
          className={`w-full py-4 px-6 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isAnalyzing
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed'
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={onStartAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Análisis en Progreso...' : 'Iniciar Análisis Facial'}
        </button>

        {/* Status Message */}
        {isAnalyzing && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 text-center">
            <div className="text-green-400 font-semibold">
              ✅ Análisis completado exitosamente
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
