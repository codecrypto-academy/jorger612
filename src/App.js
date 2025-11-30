import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import EmotionDisplay from './components/EmotionDisplay';
import VideoFeed from './components/VideoFeed';
import AnalysisPanel from './components/AnalysisPanel';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  color: white;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0 0 0;
  font-size: 1.1rem;
  font-weight: 300;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
`;

const VideoSection = styled.section`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SidePanel = styled.aside`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: fit-content;
`;

const AnalysisStatus = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
`;

const StatusText = styled.div`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const StatusSubtext = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
`;

function App() {
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    gender: null,
    ageRange: null,
    confidence: 0
  });
  const [analysisStatus, setAnalysisStatus] = useState('Esperando inicio del análisis');

  // Simulación de datos de análisis (en un caso real, esto vendría del backend)
  useEffect(() => {
    const emotions = [
      { type: 'TRANQUILO', confidence: 95, timestamp: Date.now() },
      { type: 'FELIZ', confidence: 88, timestamp: Date.now() - 1000 },
      { type: 'ENOJADO', confidence: 92, timestamp: Date.now() - 2000 },
      { type: 'MIEDO', confidence: 78, timestamp: Date.now() - 3000 }
    ];
    
    setEmotionHistory(emotions);
    setCurrentEmotion(emotions[0]);
    
    setAnalysisData({
      gender: 'Masculino',
      ageRange: { low: 50, high: 65 },
      confidence: 99.5
    });
  }, []);

  const handleEmotionUpdate = (emotion) => {
    setCurrentEmotion(emotion);
    setEmotionHistory(prev => [emotion, ...prev.slice(0, 9)]);
    setAnalysisStatus('Análisis completado exitosamente');
    
    // Actualizar datos de análisis con la nueva emoción
    setAnalysisData(prev => ({
      ...prev,
      confidence: emotion.confidence
    }));
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStatus('Análisis en progreso...');
    
    // El análisis se maneja en el VideoFeed por 30 segundos
    // No necesitamos hacer nada aquí
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
    setAnalysisStatus('Análisis completado. Revisa los resultados arriba.');
  };

  return (
    <AppContainer>
      <Header>
        <Title>ScanEoFacial</Title>
        <Subtitle>Sistema de Reconocimiento de Emociones en Tiempo Real</Subtitle>
      </Header>
      
      <MainContent>
        <VideoSection>
          <VideoFeed 
            isAnalyzing={isAnalyzing}
            onEmotionDetected={handleEmotionUpdate}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </VideoSection>
        
        <SidePanel>
          <AnalysisStatus>
            <StatusText>Estado del Sistema</StatusText>
            <StatusSubtext>{analysisStatus}</StatusSubtext>
          </AnalysisStatus>
          
          <EmotionDisplay 
            currentEmotion={currentEmotion}
            emotionHistory={emotionHistory}
          />
          
          <AnalysisPanel 
            analysisData={analysisData}
            isAnalyzing={isAnalyzing}
            onStartAnalysis={startAnalysis}
          />
        </SidePanel>
      </MainContent>
    </AppContainer>
  );
}

export default App;
