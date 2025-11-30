# Problema al activar la cámara
_Exported on 11/30/2025 at 11:32:59 CST from Cursor (2.0.75)_

---

**User**

Le doy activar camara y se queda asi como en la imagen

---

**Cursor**


Revisando el código del botón "Activar Cámara" para entender por qué no muestra el video.



Revisando los archivos del componente VideoFeed para entender el problema:



El video no se muestra porque la condición requiere `videoReady`, que depende de `onloadedmetadata`, que puede no dispararse. Ajustando el código para que el video se muestre y reproduzca correctamente:



Corrigiendo el código para que el video se muestre y se reproduzca correctamente:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          if (!videoReady) {
            startFaceDetection()
          }
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            if (!videoReady) {
              startFaceDetection()
            }
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current || !videoReady) return

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          setIsAnalyzing(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current && videoReady ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          if (!videoReady) {
            startFaceDetection()
          }
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            if (!videoReady) {
              startFaceDetection()
            }
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current || !videoReady) return

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          setIsAnalyzing(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          if (!videoReady) {
            startFaceDetection()
          }
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            if (!videoReady) {
              startFaceDetection()
            }
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current || !videoReady) return

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          setIsAnalyzing(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


Ajustando `startFaceDetection` para que funcione correctamente:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          if (!videoReady) {
            startFaceDetection()
          }
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            if (!videoReady) {
              startFaceDetection()
            }
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          setIsAnalyzing(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


Revisando la función completa para verificar que todo esté correcto:



Simplificando el código para evitar problemas con el estado:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            startFaceDetection()
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          setIsAnalyzing(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


Verificando que el video se renderice correctamente:



Verificando que no haya errores y que todo compile correctamente:



Revisando el uso de `isAnalyzing`:



Corrigiendo el uso de `isAnalyzing`: es una prop y no debería modificarse directamente. Ajustando el código:



Corrigiendo el uso incorrecto de `setIsAnalyzing`; `isAnalyzing` es una prop:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            startFaceDetection()
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          setIsAnalyzing(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            startFaceDetection()
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


## Cambios realizados:

1. **Condición de renderizado**: Cambié de `streamRef.current && videoReady` a solo `streamRef.current`, para que el video se muestre tan pronto como el stream esté disponible.

2. **Reproducción explícita**: Agregué `videoRef.current.play()` para iniciar la reproducción.

3. **Event handlers adicionales**: Agregué `onLoadedMetadata` y `onCanPlay` en el elemento `<video>` para asegurar que el video esté listo.

4. **Corrección de errores**: Eliminé el uso incorrecto de `setIsAnalyzing` (es una prop, no un estado local).

Al hacer clic en "Activar Cámara", el video debería mostrarse inmediatamente. Si no aparece, verifica:

- Permisos de la cámara en el navegador
- Que no haya otra aplicación usando la cámara
- La consola del navegador por errores

¿Puedes probar de nuevo y confirmar si el video se muestra correctamente?

---

**User**

EN teoria esta activada segun lo que se ve arriba pero no se abre alli, no hay otra aplicacion usando la camara. Esto en el console.log: react-dom.development.js:29895 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools

StyledComponent.ts:142 styled-components: it looks like an unknown prop "isAnalyzing" is being sent through to the DOM, which will likely trigger a React console error. If you would like automatic filtering of unknown props, you can opt-into that behavior via `<StyleSheetManager shouldForwardProp={...}>` (connect an API like `@emotion/is-prop-valid`) or consider using transient props (`$` prefix for automatic filtering.)

(anónimo) @ StyledComponent.ts:142Entender esta advertencia

react-dom.development.js:86 Warning: React does not recognize the `isAnalyzing` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `isanalyzing` instead. If you accidentally passed it from a parent component, remove it from the DOM element.

    at button

    at O (http://localhost:3000/static/js/bundle.js:34507:6)

    at div

    at O (http://localhost:3000/static/js/bundle.js:34507:6)

    at AnalysisPanel (http://localhost:3000/static/js/bundle.js:39523:3)

    at aside

    at O (http://localhost:3000/static/js/bundle.js:34507:6)

    at main

    at O (http://localhost:3000/static/js/bundle.js:34507:6)

    at div

    at O (http://localhost:3000/static/js/bundle.js:34507:6)

    at App (http://localhost:3000/static/js/bundle.js:39198:94)

---

**Cursor**


La cámara se activa pero el video no se muestra. Hay errores de consola por `isAnalyzing` pasándose a un elemento DOM. Revisando y corrigiendo:



Hay dos problemas:

1. Un warning de `AnalysisPanel.js` (versión antigua) que pasa `isAnalyzing` directamente a un botón.
2. El video no se muestra aunque el stream esté activo.

Revisando y corrigiendo ambos:



Corrigiendo ambos problemas:

- Warning: `AnalysisPanel.js` pasa `isAnalyzing` directamente al DOM.
- Video no se muestra: el stream está activo pero el video no se renderiza.

Aplicando las correcciones:


```javascript
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h2`
  color: white;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const DataGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DataItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const DataLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DataValue = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
`;

const ConfidenceBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ConfidenceFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.value}%;
`;

const ActionButton = styled.button`
  width: 100%;
  background: ${props => props.$isAnalyzing ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'};
  color: white;
  border: 2px solid ${props => props.$isAnalyzing ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)'};
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${props => props.$isAnalyzing ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.7;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatusMessage = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const AnalysisPanel = ({ analysisData, isAnalyzing, onStartAnalysis }) => {
  const { gender, ageRange, confidence } = analysisData;

  return (
    <Container>
      <Title>Panel de Análisis</Title>
      
      <DataGrid>
        <DataItem>
          <DataLabel>Género</DataLabel>
          <DataValue>{gender || 'No detectado'}</DataValue>
        </DataItem>
        
        <DataItem>
          <DataLabel>Rango de Edad</DataLabel>
          <DataValue>
            {ageRange ? `${ageRange.low}-${ageRange.high} años` : 'No detectado'}
          </DataValue>
        </DataItem>
        
        <DataItem>
          <DataLabel>Nivel de Confianza</DataLabel>
          <DataValue>{confidence ? `${confidence}%` : 'No disponible'}</DataValue>
          {confidence && (
            <ConfidenceBar>
              <ConfidenceFill value={confidence} />
            </ConfidenceBar>
          )}
        </DataItem>
      </DataGrid>

      <ActionButton 
        onClick={onStartAnalysis}
        disabled={isAnalyzing}
        isAnalyzing={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <LoadingSpinner />
            Analizando...
          </>
        ) : (
          'Iniciar Análisis Facial'
        )}
      </ActionButton>

      {isAnalyzing && (
        <StatusMessage>
          🔍 Analizando rostro en tiempo real...
        </StatusMessage>
      )}

      {!isAnalyzing && confidence && (
        <StatusMessage>
          ✅ Análisis completado exitosamente
        </StatusMessage>
      )}
    </Container>
  );
};

export default AnalysisPanel;

```

```javascript
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h2`
  color: white;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const DataGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DataItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const DataLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DataValue = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
`;

const ConfidenceBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ConfidenceFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.value}%;
`;

const ActionButton = styled.button`
  width: 100%;
  background: ${props => props.$isAnalyzing ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'};
  color: white;
  border: 2px solid ${props => props.$isAnalyzing ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)'};
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${props => props.$isAnalyzing ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.7;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const StatusMessage = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const AnalysisPanel = ({ analysisData, isAnalyzing, onStartAnalysis }) => {
  const { gender, ageRange, confidence } = analysisData;

  return (
    <Container>
      <Title>Panel de Análisis</Title>
      
      <DataGrid>
        <DataItem>
          <DataLabel>Género</DataLabel>
          <DataValue>{gender || 'No detectado'}</DataValue>
        </DataItem>
        
        <DataItem>
          <DataLabel>Rango de Edad</DataLabel>
          <DataValue>
            {ageRange ? `${ageRange.low}-${ageRange.high} años` : 'No detectado'}
          </DataValue>
        </DataItem>
        
        <DataItem>
          <DataLabel>Nivel de Confianza</DataLabel>
          <DataValue>{confidence ? `${confidence}%` : 'No disponible'}</DataValue>
          {confidence && (
            <ConfidenceBar>
              <ConfidenceFill value={confidence} />
            </ConfidenceBar>
          )}
        </DataItem>
      </DataGrid>

      <ActionButton 
        onClick={onStartAnalysis}
        disabled={isAnalyzing}
        $isAnalyzing={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <LoadingSpinner />
            Analizando...
          </>
        ) : (
          'Iniciar Análisis Facial'
        )}
      </ActionButton>

      {isAnalyzing && (
        <StatusMessage>
          🔍 Analizando rostro en tiempo real...
        </StatusMessage>
      )}

      {!isAnalyzing && confidence && (
        <StatusMessage>
          ✅ Análisis completado exitosamente
        </StatusMessage>
      )}
    </Container>
  );
};

export default AnalysisPanel;

```


Corrigiendo el problema del video que no se muestra. Agregando mejor manejo del stream y logs de depuración:



Los refs no causan re-render. Usando un estado para controlar la visibilidad del video y forzar el re-render cuando el stream esté disponible:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasStream, setHasStream] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsDetecting(true)
        
        // Reproducir el video explícitamente
        videoRef.current.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
        
        // Esperar a que el video esté listo - usar múltiples eventos
        const video = videoRef.current
        
        const handleLoadedMetadata = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        const handleCanPlay = () => {
          setVideoReady(true)
          startFaceDetection()
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        
        // Fallback: establecer videoReady después de un breve delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            setVideoReady(true)
            startFaceDetection()
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasStream, setHasStream] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        console.log('Stream obtenido, configurando video...')
        streamRef.current = stream
        videoRef.current.srcObject = stream
        setHasStream(true)
        setIsDetecting(true)
        
        const video = videoRef.current
        
        // Configurar eventos ANTES de reproducir
        const handleLoadedMetadata = () => {
          console.log('Video metadata cargado')
          setVideoReady(true)
          video.play().then(() => {
            console.log('Video reproducido exitosamente')
            startFaceDetection()
          }).catch(err => {
            console.error('Error reproduciendo video después de metadata:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('Video puede reproducirse')
          if (!videoReady) {
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error reproduciendo video:', err)
            })
          }
        }
        
        const handlePlaying = () => {
          console.log('Video está reproduciéndose')
          setVideoReady(true)
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        video.onplaying = handlePlaying
        
        // Intentar reproducir inmediatamente
        video.play().then(() => {
          console.log('Video reproducido inmediatamente')
        }).catch(err => {
          console.log('No se pudo reproducir inmediatamente, esperando eventos:', err)
        })
        
        // Fallback: verificar después de un delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('Video tiene datos, forzando reproducción')
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error en reproducción fallback:', err)
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsDetecting(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasStream, setHasStream] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        console.log('Stream obtenido, configurando video...')
        streamRef.current = stream
        videoRef.current.srcObject = stream
        setHasStream(true)
        setIsDetecting(true)
        
        const video = videoRef.current
        
        // Configurar eventos ANTES de reproducir
        const handleLoadedMetadata = () => {
          console.log('Video metadata cargado')
          setVideoReady(true)
          video.play().then(() => {
            console.log('Video reproducido exitosamente')
            startFaceDetection()
          }).catch(err => {
            console.error('Error reproduciendo video después de metadata:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('Video puede reproducirse')
          if (!videoReady) {
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error reproduciendo video:', err)
            })
          }
        }
        
        const handlePlaying = () => {
          console.log('Video está reproduciéndose')
          setVideoReady(true)
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        video.onplaying = handlePlaying
        
        // Intentar reproducir inmediatamente
        video.play().then(() => {
          console.log('Video reproducido inmediatamente')
        }).catch(err => {
          console.log('No se pudo reproducir inmediatamente, esperando eventos:', err)
        })
        
        // Fallback: verificar después de un delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('Video tiene datos, forzando reproducción')
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error en reproducción fallback:', err)
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
    }
    setIsDetecting(false)
    setHasStream(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasStream, setHasStream] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        console.log('Stream obtenido, configurando video...')
        streamRef.current = stream
        videoRef.current.srcObject = stream
        setHasStream(true)
        setIsDetecting(true)
        
        const video = videoRef.current
        
        // Configurar eventos ANTES de reproducir
        const handleLoadedMetadata = () => {
          console.log('Video metadata cargado')
          setVideoReady(true)
          video.play().then(() => {
            console.log('Video reproducido exitosamente')
            startFaceDetection()
          }).catch(err => {
            console.error('Error reproduciendo video después de metadata:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('Video puede reproducirse')
          if (!videoReady) {
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error reproduciendo video:', err)
            })
          }
        }
        
        const handlePlaying = () => {
          console.log('Video está reproduciéndose')
          setVideoReady(true)
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        video.onplaying = handlePlaying
        
        // Intentar reproducir inmediatamente
        video.play().then(() => {
          console.log('Video reproducido inmediatamente')
        }).catch(err => {
          console.log('No se pudo reproducir inmediatamente, esperando eventos:', err)
        })
        
        // Fallback: verificar después de un delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('Video tiene datos, forzando reproducción')
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error en reproducción fallback:', err)
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
    }
    setIsDetecting(false)
    setHasStream(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {hasStream && streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


Agregando un efecto para asegurar que el video se actualice cuando cambie el stream:



Agregando un efecto para sincronizar el video con el stream y mejorando los handlers:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasStream, setHasStream] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        console.log('Stream obtenido, configurando video...')
        streamRef.current = stream
        videoRef.current.srcObject = stream
        setHasStream(true)
        setIsDetecting(true)
        
        const video = videoRef.current
        
        // Configurar eventos ANTES de reproducir
        const handleLoadedMetadata = () => {
          console.log('Video metadata cargado')
          setVideoReady(true)
          video.play().then(() => {
            console.log('Video reproducido exitosamente')
            startFaceDetection()
          }).catch(err => {
            console.error('Error reproduciendo video después de metadata:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('Video puede reproducirse')
          if (!videoReady) {
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error reproduciendo video:', err)
            })
          }
        }
        
        const handlePlaying = () => {
          console.log('Video está reproduciéndose')
          setVideoReady(true)
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        video.onplaying = handlePlaying
        
        // Intentar reproducir inmediatamente
        video.play().then(() => {
          console.log('Video reproducido inmediatamente')
        }).catch(err => {
          console.log('No se pudo reproducir inmediatamente, esperando eventos:', err)
        })
        
        // Fallback: verificar después de un delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('Video tiene datos, forzando reproducción')
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error en reproducción fallback:', err)
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
    }
    setIsDetecting(false)
    setHasStream(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  // Efecto para asegurar que el video se actualice cuando el stream cambie
  useEffect(() => {
    if (hasStream && streamRef.current && videoRef.current) {
      const video = videoRef.current
      if (video.srcObject !== streamRef.current) {
        console.log('Actualizando srcObject del video')
        video.srcObject = streamRef.current
      }
      
      // Intentar reproducir si no está reproduciéndose
      if (video.paused && video.readyState >= 2) {
        video.play().catch(err => {
          console.error('Error en reproducción automática:', err)
        })
      }
    }
  }, [hasStream])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {hasStream && streamRef.current ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
              onCanPlay={() => {
                if (!videoReady) {
                  setVideoReady(true)
                  startFaceDetection()
                }
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


Mejorando el elemento de video y simplificando la lógica:


```typescriptreact
'use client'

import { useRef, useEffect, useState } from 'react'

interface VideoFeedProps {
  isAnalyzing: boolean
  onEmotionDetected: (emotion: any) => void
  onAnalysisComplete: () => void
}

export default function VideoFeed({ isAnalyzing, onEmotionDetected, onAnalysisComplete }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasStream, setHasStream] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [faceDetected, setFaceDetected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      })
      
      if (videoRef.current) {
        console.log('Stream obtenido, configurando video...')
        streamRef.current = stream
        videoRef.current.srcObject = stream
        setHasStream(true)
        setIsDetecting(true)
        
        const video = videoRef.current
        
        // Configurar eventos ANTES de reproducir
        const handleLoadedMetadata = () => {
          console.log('Video metadata cargado')
          setVideoReady(true)
          video.play().then(() => {
            console.log('Video reproducido exitosamente')
            startFaceDetection()
          }).catch(err => {
            console.error('Error reproduciendo video después de metadata:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('Video puede reproducirse')
          if (!videoReady) {
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error reproduciendo video:', err)
            })
          }
        }
        
        const handlePlaying = () => {
          console.log('Video está reproduciéndose')
          setVideoReady(true)
        }
        
        video.onloadedmetadata = handleLoadedMetadata
        video.oncanplay = handleCanPlay
        video.onplaying = handlePlaying
        
        // Intentar reproducir inmediatamente
        video.play().then(() => {
          console.log('Video reproducido inmediatamente')
        }).catch(err => {
          console.log('No se pudo reproducir inmediatamente, esperando eventos:', err)
        })
        
        // Fallback: verificar después de un delay
        setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('Video tiene datos, forzando reproducción')
            setVideoReady(true)
            video.play().then(() => {
              startFaceDetection()
            }).catch(err => {
              console.error('Error en reproducción fallback:', err)
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      setStatusMessage('Error accediendo a la cámara. Verifique los permisos de la cámara.')
      setIsDetecting(false)
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
    }
    setIsDetecting(false)
    setHasStream(false)
    setFaceDetected(false)
    setStatusMessage('')
    setAnalysisProgress(0)
    setTimeRemaining(30)
    setVideoReady(false)
  }

  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Verificar que el video tenga dimensiones válidas antes de iniciar
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Esperar un poco más si el video aún no tiene dimensiones
      setTimeout(() => {
        if (videoRef.current && isDetecting) {
          startFaceDetection()
        }
      }, 100)
      return
    }

    const detectFace = () => {
      if (!isDetecting) return

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current!.videoWidth === 0 || videoRef.current!.videoHeight === 0) {
          requestAnimationFrame(detectFace)
          return
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const video = videoRef.current!
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Dibujar el frame actual del video
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Obtener los datos de la imagen
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0
        let facePixels = 0
        let validPixels = 0
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++
            
            // Calcular brillo
            const brightness = (r + g + b) / 3
            totalBrightness += brightness
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels
          const faceRatio = facePixels / validPixels
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250
          const hasFacePixels = faceRatio > 0.05 // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true)
            setStatusMessage('')
          } else {
            setFaceDetected(false)
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.')
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.')
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara')
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error)
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true)
            setStatusMessage('')
          }
        }, 2000)
      }

      requestAnimationFrame(detectFace)
    }

    detectFace()
  }

  const startAnalysis = async () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara')
      return
    }

    setAnalysisProgress(0)
    setTimeRemaining(30)

    try {
      // Capturar frame del video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = videoRef.current!
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Enviar al backend Python
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      })

      if (!response.ok) {
        throw new Error('Error en el análisis del backend')
      }

      const result = await response.json()
      
      // Actualizar con el resultado real del Python
      onEmotionDetected({
        type: result.emotion,
        confidence: result.confidence,
        timestamp: Date.now(),
        backendData: {
          gender: result.gender,
          ageRange: result.ageRange,
          confidence: result.confidence
        }
      })

      // Actualizar datos de análisis
      if (onAnalysisComplete) {
        onAnalysisComplete()
      }

    } catch (error) {
      console.error('Error en análisis:', error)
      setStatusMessage('Error en el análisis. Intentando simulación...')
      
      // Fallback a simulación si falla el backend
      setTimeout(() => {
        const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO']
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
        const confidence = Math.floor(Math.random() * 20) + 80
        
        onEmotionDetected({
          type: randomEmotion,
          confidence: confidence,
          timestamp: Date.now()
        })
        
        if (onAnalysisComplete) {
          onAnalysisComplete()
        }
      }, 2000)
    }

    // Timer visual
    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + (100 / 30)
      })
    }, 1000)
  }

  const simulateFaceDetection = () => {
    setFaceDetected(true)
    setStatusMessage('')
  }

  const resetFaceDetection = () => {
    setFaceDetected(false)
    setStatusMessage('Posicione su rostro en el centro de la cámara')
  }

  useEffect(() => {
    return () => {
      stopVideo()
    }
  }, [])

  // Efecto para asegurar que el video se actualice cuando el stream cambie
  useEffect(() => {
    if (hasStream && streamRef.current && videoRef.current) {
      const video = videoRef.current
      if (video.srcObject !== streamRef.current) {
        console.log('Actualizando srcObject del video')
        video.srcObject = streamRef.current
      }
      
      // Intentar reproducir si no está reproduciéndose
      if (video.paused && video.readyState >= 2) {
        video.play().catch(err => {
          console.error('Error en reproducción automática:', err)
        })
      }
    }
  }, [hasStream])

  return (
    <div className="text-center">
      <h2 className="text-white text-2xl font-semibold mb-6">
        Feed de Video
      </h2>
      
      <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl w-full max-w-2xl mx-auto aspect-video">
        {hasStream && streamRef.current ? (
          <>
            <video
              ref={videoRef}
              key="camera-video"
              className="w-full h-full object-cover block"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                console.log('onLoadedMetadata disparado')
                setVideoReady(true)
                if (videoRef.current) {
                  videoRef.current.play().then(() => {
                    startFaceDetection()
                  }).catch(err => {
                    console.error('Error en play desde onLoadedMetadata:', err)
                  })
                }
              }}
              onCanPlay={() => {
                console.log('onCanPlay disparado')
                setVideoReady(true)
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().then(() => {
                    startFaceDetection()
                  }).catch(err => {
                    console.error('Error en play desde onCanPlay:', err)
                  })
                }
              }}
              onPlaying={() => {
                console.log('Video está reproduciéndose ahora')
                setVideoReady(true)
              }}
              onError={(e) => {
                console.error('Error en el elemento video:', e)
                setStatusMessage('Error al reproducir el video. Intente nuevamente.')
              }}
            />
            
            {/* Camera Status */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Cámara Activa
            </div>
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Face Frame */}
              {faceDetected && (
                <div className="absolute border-4 border-green-500 rounded-full w-48 h-48 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-2xl shadow-green-500/50"></div>
              )}
              
              {/* Detection Lines */}
              <div className="absolute top-[15%] left-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[15%] right-[15%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] left-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute top-[35%] right-[8%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] left-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
              <div className="absolute bottom-[25%] right-[25%] w-1 h-12 bg-gradient-to-b from-white/90 to-transparent"></div>
            </div>

            {/* Face Detection Status */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold z-10 flex items-center gap-2 transition-all duration-300 ${
              faceDetected 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <span className="text-base">
                {faceDetected ? '✅' : '❌'}
              </span>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl text-center text-lg font-medium z-30 max-w-[80%] shadow-2xl">
                <div className="text-2xl mb-2">
                  {faceDetected ? '🎯' : '⚠️'}
                </div>
                {statusMessage}
                {faceDetected && (
                  <div className="mt-2 text-sm opacity-80 text-green-400">
                    ✅ Puede iniciar el análisis ahora
                  </div>
                )}
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[85%] h-2 bg-white/20 rounded-full overflow-hidden shadow-lg">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-green-500/50"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold text-center bg-black/70 px-6 py-2 rounded-full shadow-lg">
                  Análisis en curso: {timeRemaining}s
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
            <div>
              <div className="text-5xl mb-4">📹</div>
              <div className="mb-2">
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div className="text-sm opacity-80">
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            isDetecting 
              ? 'bg-white/30 text-white border-2 border-white/40 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </button>
        
        <button 
          className={`px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md ${
            !isDetecting || !faceDetected || isAnalyzing
              ? 'bg-white/10 text-white/50 border-2 border-white/20 cursor-not-allowed' 
              : 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30 hover:-translate-y-1 hover:shadow-lg'
          }`}
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
        >
          Iniciar Análisis (30s)
        </button>
        
        {isDetecting && (
          <button 
            className="px-8 py-4 rounded-full text-lg font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg"
            onClick={stopVideo}
          >
            Detener Cámara
          </button>
        )}
      </div>

      {/* Help Message */}
      {isDetecting && (
        <div className="bg-white/10 rounded-2xl p-6 mt-6 border border-white/20 text-left max-w-2xl mx-auto">
          <h3 className="text-white text-lg font-semibold mb-4">💡 Consejos para mejor detección:</h3>
          <ul className="text-white/80 text-sm leading-relaxed pl-6 space-y-2">
            <li>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</li>
            <li>Mantén tu rostro centrado en la cámara</li>
            <li>Acércate a la cámara hasta que aparezca el marco verde</li>
            <li>Mantén una expresión neutral durante el análisis</li>
            <li>Evita movimientos bruscos de la cabeza</li>
          </ul>
          
          <div className="mt-4 text-center space-x-2">
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={simulateFaceDetection}
            >
              🧪 Simular Detección de Rostro
            </button>
            <button 
              className="bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-yellow-500/30 hover:-translate-y-1"
              onClick={resetFaceDetection}
            >
              🔄 Resetear Detección
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```


Resumiendo los cambios y verificando que todo funcione:



He corregido los problemas. Resumen de cambios:

## Correcciones realizadas:

### 1. Warning de React corregido
- Cambiado `isAnalyzing` a `$isAnalyzing` en `AnalysisPanel.js` (prefijo `$` para styled-components evita que se pase al DOM).

### 2. Video no se mostraba
- Agregado estado `hasStream` para forzar el re-render cuando el stream está disponible (los refs no causan re-renders).
- Mejorada la lógica de reproducción con múltiples intentos y eventos.
- Agregado `useEffect` para sincronizar el video cuando el stream cambia.
- Agregados logs de consola para depuración.
- Manejo de errores mejorado con eventos `onError` en el video.

### Cambios principales:

1. Estado `hasStream`: fuerza el re-render cuando la cámara se activa.
2. Reproducción del video: múltiples intentos para asegurar que se reproduzca.
3. Logs de depuración: mensajes en consola para rastrear el proceso.

Ahora, cuando hagas clic en "Activar Cámara":
- El video debería mostrarse inmediatamente
- Verás logs en la consola del navegador indicando el progreso
- El warning de React debería desaparecer

Prueba de nuevo. Si el video aún no aparece:
1. Abre la consola del navegador (F12) y revisa los mensajes.
2. Verifica que no haya errores en rojo.
3. Asegúrate de haber permitido el acceso a la cámara cuando el navegador lo solicite.

¿Puedes probar de nuevo y decirme qué ves en la consola?

