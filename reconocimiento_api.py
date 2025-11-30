#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ScanEoFacial - API Backend
Script modificado para ser llamado desde Next.js
"""

import cv2
import boto3
import argparse
import sys
import os
from botocore.exceptions import ClientError, NoCredentialsError

# Diccionario de traducción de emociones
EMOTION_TRANSLATIONS = {
    'CALM': 'TRANQUILO',
    'ANGRY': 'ENOJADO',
    'HAPPY': 'FELIZ',
    'FEAR': 'MIEDO',
    'SAD': 'TRISTE',
    'SURPRISED': 'SORPRENDIDO',
    'DISGUSTED': 'DISGUSTADO',
    'CONFUSED': 'CONFUNDIDO'
}

def analyze_image(image_path):
    """Analiza una imagen usando AWS Rekognition"""
    
    # Verificar que la imagen existe
    if not os.path.exists(image_path):
        print(f"Error: La imagen {image_path} no existe")
        return None
    
    try:
        # Inicializar cliente AWS Rekognition
        client = boto3.client('rekognition')
        
        # Leer la imagen
        with open(image_path, 'rb') as image:
            image_bytes = image.read()
        
        # Detectar rostros y emociones
        response = client.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['ALL']
        )
        
        if not response['FaceDetails']:
            print("No se detectaron rostros en la imagen")
            return {
                'emotion': 'NO_ROSTRO',
                'gender': 'No detectado',
                'ageRange': None,
                'confidence': 0
            }
        
        # Obtener el primer rostro detectado
        face = response['FaceDetails'][0]
        
        # Extraer emociones
        emotions = face.get('Emotions', [])
        if emotions:
            # Obtener la emoción con mayor confianza
            dominant_emotion = max(emotions, key=lambda x: x['Confidence'])
            emotion_name = dominant_emotion['Name']
            emotion_confidence = dominant_emotion['Confidence']
            
            # Traducir la emoción al español
            emotion_spanish = EMOTION_TRANSLATIONS.get(emotion_name, emotion_name)
        else:
            emotion_spanish = 'NEUTRAL'
            emotion_confidence = 100.0
        
        # Extraer género
        gender = face.get('Gender', {})
        gender_value = gender.get('Value', 'No detectado')
        gender_confidence = gender.get('Confidence', 0)
        
        # Traducir género
        if gender_value == 'Male':
            gender_spanish = 'Masculino'
        elif gender_value == 'Female':
            gender_spanish = 'Femenino'
        else:
            gender_spanish = 'No detectado'
        
        # Extraer rango de edad
        age_range = face.get('AgeRange', {})
        age_low = age_range.get('Low', 0)
        age_high = age_range.get('High', 0)
        
        # Calcular confianza general
        overall_confidence = (emotion_confidence + gender_confidence) / 2
        
        result = {
            'emotion': emotion_spanish,
            'gender': gender_spanish,
            'ageRange': {'low': age_low, 'high': age_high},
            'confidence': overall_confidence
        }
        
        # Imprimir resultados para debugging
        print(f"Emoción dominante: {emotion_spanish} (Confianza: {emotion_confidence:.1f}%)")
        print(f"Género: {gender_spanish} (Confianza: {gender_confidence:.1f}%)")
        print(f"Rango de edad: {age_low}-{age_high} años")
        print(f"Confianza general: {overall_confidence:.1f}%")
        
        return result
        
    except NoCredentialsError:
        print("Error: No se encontraron credenciales de AWS")
        return None
    except ClientError as e:
        print(f"Error de AWS: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {e}")
        return None

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Analizar imagen con AWS Rekognition')
    parser.add_argument('--image', required=True, help='Ruta a la imagen a analizar')
    
    args = parser.parse_args()
    
    # Analizar la imagen
    result = analyze_image(args.image)
    
    if result:
        # El resultado ya se imprime en analyze_image
        # Aquí podríamos hacer algo adicional si es necesario
        pass
    else:
        print("Error en el análisis de la imagen")
        sys.exit(1)

if __name__ == "__main__":
    main()
