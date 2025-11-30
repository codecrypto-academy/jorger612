'use client'

import { useState, useEffect } from 'react'
import EmotionDisplay from '@/components/EmotionDisplay'
import VideoFeed from '@/components/VideoFeed'
import AnalysisPanel from '@/components/AnalysisPanel'

export default function Home() {
  const [currentEmotion, setCurrentEmotion] = useState<any>(null)
  const [emotionHistory, setEmotionHistory] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState({
    gender: null,
    ageRange: null,
    confidence: 0
  })
  const [analysisStatus, setAnalysisStatus] = useState('Esperando inicio del análisis')

  // Simulación de datos de análisis (en un caso real, esto vendría del backend)
  useEffect(() => {
    const emotions = [
      { type: 'TRANQUILO', confidence: 95, timestamp: Date.now() },
      { type: 'FELIZ', confidence: 88, timestamp: Date.now() - 1000 },
      { type: 'ENOJADO', confidence: 92, timestamp: Date.now() - 2000 },
      { type: 'MIEDO', confidence: 78, timestamp: Date.now() - 3000 }
    ]
    
    setEmotionHistory(emotions)
    setCurrentEmotion(emotions[0])
    
    setAnalysisData({
      gender: 'Masculino',
      ageRange: { low: 50, high: 65 },
      confidence: 99.5
    })
  }, [])

  const handleEmotionUpdate = (emotion: any) => {
    setCurrentEmotion(emotion)
    setEmotionHistory(prev => [emotion, ...prev.slice(0, 9)])
    setAnalysisStatus('Análisis completado exitosamente')
    
    // Si el backend devuelve datos adicionales, actualizarlos
    if (emotion.backendData) {
      setAnalysisData({
        gender: emotion.backendData.gender,
        ageRange: emotion.backendData.ageRange,
        confidence: emotion.backendData.confidence
      })
    } else {
      setAnalysisData(prev => ({
        ...prev,
        confidence: emotion.confidence
      }))
    }
  }

  const startAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisStatus('Análisis en progreso...')
  }

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false)
    setAnalysisStatus('Análisis completado. Revisa los resultados arriba.')
  }

  return (
    <div className="min-h-screen font-['Inter']">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md p-4 text-center border-b border-white/20">
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          ScanEoFacial
        </h1>
        <p className="text-white/80 text-lg font-light">
          Sistema de Reconocimiento de Emociones en Tiempo Real
        </p>
      </header>
      
      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 p-8 max-w-7xl mx-auto">
        {/* Video Section */}
        <section className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          <VideoFeed 
            isAnalyzing={isAnalyzing}
            onEmotionDetected={handleEmotionUpdate}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </section>
        
        {/* Side Panel */}
        <aside className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 h-fit">
          {/* Analysis Status */}
          <div className="bg-white/15 rounded-2xl p-6 mb-6 text-center border-2 border-white/30">
            <div className="text-white text-xl font-semibold mb-2">
              Estado del Sistema
            </div>
            <div className="text-white/80 text-base">
              {analysisStatus}
            </div>
          </div>
          
          <EmotionDisplay 
            currentEmotion={currentEmotion}
            emotionHistory={emotionHistory}
          />
          
          <AnalysisPanel 
            analysisData={analysisData}
            isAnalyzing={isAnalyzing}
            onStartAnalysis={startAnalysis}
          />
        </aside>
      </main>
    </div>
  )
}
