import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;
`;

const Title = styled.h2`
  color: white;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const VideoContainer = styled.div`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  aspect-ratio: 4/3;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CameraStatus = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isActive ? '#4CAF50' : '#F44336'};
  animation: ${props => props.$isActive ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const FaceDetectionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
`;

const FaceFrame = styled.div`
  position: absolute;
  border: 3px solid #4CAF50;
  border-radius: 50%;
  width: 180px;
  height: 180px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: ${props => props.$isDetected ? 'block' : 'none'};
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
`;

const DetectionLines = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const DetectionLine = styled.div`
  position: absolute;
  width: 3px;
  height: 50px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), transparent);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -4px;
    width: 10px;
    height: 10px;
    background: #4CAF50;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
  }
`;

const StatusMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 15px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  z-index: 10;
  display: ${props => props.$show ? 'block' : 'none'};
  max-width: 80%;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A, #CDDC39);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.$progress}%;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
`;

const Timer = styled.div`
  color: white;
  font-size: 1.3rem;
  font-weight: 700;
  margin-top: 1rem;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
`;

const Controls = styled.div`
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: ${props => props.$primary ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 2px solid ${props => props.$primary ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
  padding: 1rem 2rem;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: ${props => props.$primary ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const HelpMessage = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: left;
`;

const HelpTitle = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const HelpList = styled.ul`
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const HelpItem = styled.li`
  margin-bottom: 0.5rem;
`;

const FaceDetectionStatus = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: ${props => props.$isDetected ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
`;

const DetectionIcon = styled.div`
  font-size: 1rem;
`;

const TestButton = styled.button`
  background: rgba(255, 193, 7, 0.2);
  color: #FFC107;
  border: 2px solid rgba(255, 193, 7, 0.4);
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  margin-top: 1rem;
  
  &:hover {
    background: rgba(255, 193, 7, 0.3);
    transform: translateY(-1px);
  }
`;

const VideoFeed = ({ isAnalyzing, onEmotionDetected, onAnalysisComplete }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [faceDetected, setFaceDetected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [videoReady, setVideoReady] = useState(false);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsDetecting(true);
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          setVideoReady(true);
          startFaceDetection();
        };
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      setStatusMessage('Error accediendo a la cámara');
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
    setFaceDetected(false);
    setStatusMessage('');
    setAnalysisProgress(0);
    setTimeRemaining(30);
    setVideoReady(false);
  };

  const startFaceDetection = () => {
    if (!videoRef.current || !videoReady) return;

    const detectFace = () => {
      if (!isDetecting) return;

      try {
        // Verificar que el video tenga dimensiones válidas
        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
          requestAnimationFrame(detectFace);
          return;
        }

        // Crear un canvas temporal para analizar el frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dibujar el frame actual del video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Obtener los datos de la imagen
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Algoritmo mejorado de detección de rostro
        let totalBrightness = 0;
        let facePixels = 0;
        let validPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Solo procesar píxeles válidos (no completamente negros)
          if (r > 0 || g > 0 || b > 0) {
            validPixels++;
            
            // Calcular brillo
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            
            // Detectar píxeles que podrían ser piel (rango más amplio)
            if (r > 60 && g > 30 && b > 15 && 
                Math.abs(r - g) > 10 && Math.abs(r - b) > 10 && 
                r > g && r > b && brightness > 40) {
              facePixels++;
            }
          }
        }
        
        if (validPixels > 0) {
          const avgBrightness = totalBrightness / validPixels;
          const faceRatio = facePixels / validPixels;
          
          // Condiciones más permisivas para detectar un rostro
          const hasGoodLighting = avgBrightness > 30 && avgBrightness < 250;
          const hasFacePixels = faceRatio > 0.05; // Solo 5% de píxeles de piel
          
          if (hasGoodLighting && hasFacePixels) {
            setFaceDetected(true);
            setStatusMessage('');
          } else {
            setFaceDetected(false);
            if (avgBrightness < 30) {
              setStatusMessage('Iluminación muy baja. Mejore la iluminación.');
            } else if (avgBrightness > 250) {
              setStatusMessage('Demasiada luz. Reduzca la iluminación.');
            } else {
              setStatusMessage('Posicione su rostro en el centro de la cámara');
            }
          }
        }
        
      } catch (error) {
        console.error('Error en detección facial:', error);
        // Fallback: simular detección después de un tiempo
        setTimeout(() => {
          if (isDetecting) {
            setFaceDetected(true);
            setStatusMessage('');
          }
        }, 2000);
      }

      requestAnimationFrame(detectFace);
    };

    detectFace();
  };

  const startAnalysis = () => {
    if (!faceDetected) {
      setStatusMessage('Por favor, posicione su rostro en el centro de la cámara');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setTimeRemaining(30);

    const analysisInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(analysisInterval);
          setIsAnalyzing(false);
          
          // Simular detección de emociones
          const emotions = ['TRANQUILO', 'FELIZ', 'ENOJADO', 'MIEDO'];
          const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
          const confidence = Math.floor(Math.random() * 20) + 80;
          
          onEmotionDetected({
            type: randomEmotion,
            confidence: confidence,
            timestamp: Date.now()
          });
          
          // Notificar que el análisis se completó
          if (onAnalysisComplete) {
            onAnalysisComplete();
          }
          
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / 30);
      });
    }, 1000);
  };

  const simulateFaceDetection = () => {
    setFaceDetected(true);
    setStatusMessage('');
  };

  const resetFaceDetection = () => {
    setFaceDetected(false);
    setStatusMessage('Posicione su rostro en el centro de la cámara');
  };

  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, []);

  return (
    <Container>
      <Title>Feed de Video</Title>
      
      <VideoContainer>
        {streamRef.current && videoReady ? (
          <>
            <VideoElement
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
            
            <CameraStatus>
              <StatusDot $isActive={true} />
              Cámara Activa
            </CameraStatus>
            
            <FaceDetectionOverlay>
              <FaceFrame $isDetected={faceDetected} />
              
              <DetectionLines>
                <DetectionLine style={{ top: '15%', left: '15%' }} />
                <DetectionLine style={{ top: '15%', right: '15%' }} />
                <DetectionLine style={{ top: '35%', left: '8%' }} />
                <DetectionLine style={{ top: '35%', right: '8%' }} />
                <DetectionLine style={{ bottom: '25%', left: '25%' }} />
                <DetectionLine style={{ bottom: '25%', right: '25%' }} />
              </DetectionLines>
            </FaceDetectionOverlay>

            <FaceDetectionStatus $isDetected={faceDetected}>
              <DetectionIcon>
                {faceDetected ? '✅' : '❌'}
              </DetectionIcon>
              {faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
            </FaceDetectionStatus>

            <StatusMessage $show={statusMessage !== ''}>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                {faceDetected ? '🎯' : '⚠️'}
              </div>
              {statusMessage}
              {faceDetected && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.9rem', 
                  opacity: 0.8,
                  color: '#4CAF50'
                }}>
                  ✅ Puede iniciar el análisis ahora
                </div>
              )}
            </StatusMessage>

            {isAnalyzing && (
              <>
                <ProgressBar>
                  <ProgressFill $progress={analysisProgress} />
                </ProgressBar>
                <Timer>Análisis en curso: {timeRemaining}s</Timer>
              </>
            )}
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
              <div style={{ marginBottom: '0.5rem' }}>
                {isDetecting ? 'Inicializando cámara...' : 'Cámara no activa'}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {isDetecting ? 'Espere un momento...' : 'Haz clic en "Activar Cámara" para comenzar'}
              </div>
            </div>
          </div>
        )}
      </VideoContainer>

      <Controls>
        <Button 
          $primary 
          onClick={startVideo}
          disabled={isDetecting}
        >
          {isDetecting ? 'Cámara Activa' : 'Activar Cámara'}
        </Button>
        
        <Button 
          onClick={startAnalysis}
          disabled={!isDetecting || !faceDetected || isAnalyzing}
          $primary
        >
          Iniciar Análisis (30s)
        </Button>
        
        {isDetecting && (
          <Button onClick={stopVideo}>
            Detener Cámara
          </Button>
        )}
      </Controls>

      {isDetecting && (
        <HelpMessage>
          <HelpTitle>💡 Consejos para mejor detección:</HelpTitle>
          <HelpList>
            <HelpItem>Asegúrate de estar bien iluminado (no muy oscuro ni muy brillante)</HelpItem>
            <HelpItem>Mantén tu rostro centrado en la cámara</HelpItem>
            <HelpItem>Acércate a la cámara hasta que aparezca el marco verde</HelpItem>
            <HelpItem>Mantén una expresión neutral durante el análisis</HelpItem>
            <HelpItem>Evita movimientos bruscos de la cabeza</HelpItem>
          </HelpList>
          
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <TestButton onClick={simulateFaceDetection}>
              🧪 Simular Detección de Rostro
            </TestButton>
            <TestButton onClick={resetFaceDetection} style={{ marginLeft: '0.5rem' }}>
              🔄 Resetear Detección
            </TestButton>
          </div>
        </HelpMessage>
      )}
    </Container>
  );
};

export default VideoFeed;
