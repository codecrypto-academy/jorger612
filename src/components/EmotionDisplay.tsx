'use client'

interface Emotion {
  type: string
  confidence: number
  timestamp: number
}

interface EmotionDisplayProps {
  currentEmotion: Emotion | null
  emotionHistory: Emotion[]
}

export default function EmotionDisplay({ currentEmotion, emotionHistory }: EmotionDisplayProps) {
  const getEmotionColor = (emotionType: string) => {
    switch (emotionType) {
      case 'TRANQUILO':
        return 'from-blue-500 to-blue-600'
      case 'FELIZ':
        return 'from-green-500 to-green-600'
      case 'ENOJADO':
        return 'from-red-500 to-red-600'
      case 'MIEDO':
        return 'from-purple-500 to-purple-600'
      case 'TRISTE':
        return 'from-gray-500 to-gray-600'
      case 'SORPRENDIDO':
        return 'from-yellow-500 to-yellow-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getEmotionIcon = (emotionType: string) => {
    switch (emotionType) {
      case 'TRANQUILO':
        return '😌'
      case 'FELIZ':
        return '😊'
      case 'ENOJADO':
        return '😠'
      case 'MIEDO':
        return '😨'
      case 'TRISTE':
        return '😢'
      case 'SORPRENDIDO':
        return '😲'
      default:
        return '😐'
    }
  }

  if (!currentEmotion) {
    return (
      <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20">
        <h3 className="text-white text-lg font-semibold mb-4">Estado de Emociones</h3>
        <div className="text-white/60 text-center py-8">
          No hay emociones detectadas
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Emotion */}
      <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
        <h3 className="text-white text-lg font-semibold mb-4">Estado de Emociones</h3>
        
        <div className="text-center">
          <div className={`text-6xl mb-4 ${getEmotionColor(currentEmotion.type)} bg-gradient-to-br p-4 rounded-full inline-block`}>
            {getEmotionIcon(currentEmotion.type)}
          </div>
          
          <div className="text-white text-3xl font-bold mb-2">
            {currentEmotion.type}
          </div>
          
          <div className="text-white/80 text-lg">
            Confianza: {currentEmotion.confidence}%
          </div>
        </div>
      </div>

      {/* Emotion History */}
      <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
        <h3 className="text-white text-lg font-semibold mb-4">Historial de Emociones</h3>
        
        <div className="space-y-3">
          {emotionHistory.slice(1, 6).map((emotion, index) => (
            <div 
              key={index}
              className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getEmotionIcon(emotion.type)}
                </span>
                <span className="text-white font-medium">
                  {emotion.type}
                </span>
              </div>
              
              <div className="text-white/80 font-semibold">
                {emotion.confidence}%
              </div>
            </div>
          ))}
        </div>
        
        {emotionHistory.length <= 1 && (
          <div className="text-white/60 text-center py-4">
            No hay historial disponible
          </div>
        )}
      </div>
    </div>
  )
}
