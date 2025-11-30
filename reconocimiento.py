import boto3

import cv2

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

def analyze_video(video_capture):

    client = boto3.client('rekognition')

    while True:

        ret, frame = video_capture.read()

        if not ret:

            break

        # Convertir el frame a formato JPEG para enviar a Rekognition

        ret, buffer = cv2.imencode('.jpg', frame)

        frame_as_bytes = buffer.tobytes()
        
        try:
            response = client.detect_faces(
                Image={'Bytes': frame_as_bytes},
                Attributes=['ALL']
            )
            
            for face in response['FaceDetails']:

                emotions = face['Emotions']
                edad = face['AgeRange']
                print(f"Edad estimada: {edad['Low']}-{edad['High']} años")
                genero = face['Gender']
                print(f"Género: {genero['Value']} (Confianza: {genero['Confidence']:.1f}%)")
                #lan = face['Landmarks']
                #print(lan)


                emotions.sort(key=lambda x: x['Confidence'], reverse=True)

                dominant_emotion = emotions[0]['Type']
                emotion_confidence = emotions[0]['Confidence']
                
                # Traducir la emoción al español
                emotion_spanish = EMOTION_TRANSLATIONS.get(dominant_emotion, dominant_emotion)
                
                print(f"Emoción dominante: {emotion_spanish} (Confianza: {emotion_confidence:.1f}%)")

                if dominant_emotion == 'Angry' or dominant_emotion == 'Fear':

                    print(f"⚠️  La emoción dominante es: {emotion_spanish}. Se recomienda una evaluación más profunda.")

                else:

                    print(f"✅ La emoción dominante es: {emotion_spanish}.")
                    
        except Exception as e:
            print(f"Error en el análisis: {e}")
            continue

        # Procesar los resultados de Rekognition (similar al código anterior)

        # ...

        # Mostrar el frame

        cv2.imshow('Video', frame)

        if cv2.waitKey(1) == ord('q'):

            break

if __name__ == "__main__":

    video_capture = cv2.VideoCapture(0)  # 0 para la cámara web por defecto

    analyze_video(video_capture)

    video_capture.release()

    cv2.destroyAllWindows()