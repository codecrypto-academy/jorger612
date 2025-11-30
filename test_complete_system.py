#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prueba Completa del Sistema ScanEoFacial
"""

import requests
import json
import time
import base64
from PIL import Image
import io

def create_test_image():
    """Crea una imagen de prueba simple"""
    try:
        # Crear una imagen de prueba (cuadro negro con texto)
        img = Image.new('RGB', (640, 480), color='black')
        
        # Convertir a base64
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"❌ Error creando imagen de prueba: {e}")
        return None

def test_nextjs_api():
    """Prueba la API de Next.js"""
    
    print("🧪 Probando API de Next.js...")
    print("-" * 40)
    
    # Crear imagen de prueba
    test_image = create_test_image()
    if not test_image:
        print("❌ No se pudo crear imagen de prueba")
        return False
    
    try:
        # URL de la API
        api_url = "http://localhost:3000/api/analyze-face"
        
        # Datos de la petición
        payload = {
            "imageData": test_image
        }
        
        print(f"📡 Enviando petición a: {api_url}")
        
        # Hacer petición POST
        response = requests.post(
            api_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API respondió correctamente!")
            print(f"📋 Resultado: {json.dumps(result, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"❌ Error en API: {response.status_code}")
            print(f"📝 Respuesta: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar a la API")
        print("💡 Verifica que Next.js esté ejecutándose en http://localhost:3000")
        return False
        
    except requests.exceptions.Timeout:
        print("❌ Timeout en la petición")
        return False
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def test_python_backend():
    """Prueba el backend Python directamente"""
    
    print("\n🐍 Probando Backend Python...")
    print("-" * 40)
    
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        # Crear cliente Rekognition
        client = boto3.client('rekognition')
        
        # Crear imagen de prueba simple
        test_image = create_test_image()
        if test_image:
            # Remover el prefijo data:image/jpeg;base64,
            base64_data = test_image.split(',')[1]
            image_bytes = base64.b64decode(base64_data)
            
            print("📸 Analizando imagen de prueba...")
            
            # Detectar rostros
            response = client.detect_faces(
                Image={'Bytes': image_bytes},
                Attributes=['ALL']
            )
            
            print(f"✅ AWS Rekognition respondió correctamente")
            print(f"📊 Rostros detectados: {len(response['FaceDetails'])}")
            
            if response['FaceDetails']:
                face = response['FaceDetails'][0]
                emotions = face.get('Emotions', [])
                if emotions:
                    dominant = max(emotions, key=lambda x: x['Confidence'])
                    print(f"😊 Emoción dominante: {dominant['Name']} ({dominant['Confidence']:.1f}%)")
            
            return True
            
    except ImportError:
        print("❌ boto3 no está instalado")
        return False
        
    except ClientError as e:
        print(f"❌ Error de AWS: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def main():
    """Función principal de pruebas"""
    
    print("🚀 PRUEBA COMPLETA DEL SISTEMA SCANEOFACIAL")
    print("=" * 60)
    
    # Prueba 1: Backend Python
    python_ok = test_python_backend()
    
    # Prueba 2: API Next.js
    nextjs_ok = test_nextjs_api()
    
    # Resumen
    print("\n📊 RESUMEN DE PRUEBAS")
    print("=" * 30)
    print(f"🐍 Backend Python: {'✅ OK' if python_ok else '❌ FALLÓ'}")
    print(f"⚛️  API Next.js: {'✅ OK' if nextjs_ok else '❌ FALLÓ'}")
    
    if python_ok and nextjs_ok:
        print("\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("🚀 Puedes usar ScanEoFacial con análisis real de AWS")
        print("🌐 Abre http://localhost:3000 en tu navegador")
    elif python_ok:
        print("\n⚠️  Backend Python OK, pero API Next.js falló")
        print("💡 Verifica que Next.js esté ejecutándose")
    elif nextjs_ok:
        print("\n⚠️  API Next.js OK, pero Backend Python falló")
        print("💡 Verifica la configuración de AWS")
    else:
        print("\n❌ Ambos sistemas fallaron")
        print("💡 Revisa la configuración general")

if __name__ == "__main__":
    main()
