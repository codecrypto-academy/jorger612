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
