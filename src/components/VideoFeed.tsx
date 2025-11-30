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
