import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const CurrentEmotion = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
`;

const EmotionType = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Confidence = styled.div`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

const HistoryTitle = styled.h3`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 500;
`;

const EmotionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EmotionItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const EmotionName = styled.span`
  color: white;
  font-weight: 500;
`;

const EmotionConfidence = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const getEmotionColor = (emotionType) => {
  const colors = {
    'TRANQUILO': '#4CAF50',
    'FELIZ': '#FFC107',
    'ENOJADO': '#F44336',
    'MIEDO': '#9C27B0',
    'TRISTE': '#2196F3',
    'SORPRENDIDO': '#FF9800',
    'DISGUSTADO': '#795548',
    'CONFUNDIDO': '#607D8B'
  };
  return colors[emotionType] || '#FFFFFF';
};

const EmotionDisplay = ({ currentEmotion, emotionHistory }) => {
  if (!currentEmotion) {
    return (
      <Container>
        <Title>Estado de Emociones</Title>
        <CurrentEmotion>
          <EmotionType>Esperando...</EmotionType>
          <Confidence>Inicia el análisis</Confidence>
        </CurrentEmotion>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Estado de Emociones</Title>
      
      <CurrentEmotion style={{ borderColor: getEmotionColor(currentEmotion.type) }}>
        <EmotionType style={{ color: getEmotionColor(currentEmotion.type) }}>
          {currentEmotion.type}
        </EmotionType>
        <Confidence>
          Confianza: {currentEmotion.confidence}%
        </Confidence>
      </CurrentEmotion>

      <HistoryTitle>Historial de Emociones</HistoryTitle>
      <EmotionList>
        {emotionHistory.slice(1, 6).map((emotion, index) => (
          <EmotionItem key={index}>
            <EmotionName>{emotion.type}</EmotionName>
            <EmotionConfidence>{emotion.confidence}%</EmotionConfidence>
          </EmotionItem>
        ))}
      </EmotionList>
    </Container>
  );
};

export default EmotionDisplay;
