#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuración AWS para ScanEoFacial
"""

import boto3
import os
from botocore.exceptions import ClientError, NoCredentialsError

def test_aws_credentials():
    """Prueba las credenciales AWS y muestra información del usuario"""
    
    try:
        # Crear cliente STS para verificar credenciales
        sts_client = boto3.client('sts')
        
        # Obtener identidad del usuario
        response = sts_client.get_caller_identity()
        
        print("✅ Credenciales AWS configuradas correctamente!")
        print(f"📋 Usuario ID: {response['UserId']}")
        print(f"🏢 Cuenta: {response['Account']}")
        print(f"🌍 ARN: {response['Arn']}")
        
        # Probar Rekognition
        rekognition_client = boto3.client('rekognition')
        
        # Listar colecciones (esto prueba los permisos)
        try:
            collections = rekognition_client.list_collections()
            print("✅ AWS Rekognition accesible")
            print(f"📚 Colecciones disponibles: {len(collections['CollectionIds'])}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDeniedException':
                print("⚠️  AWS Rekognition accesible pero sin permisos para listar colecciones")
            else:
                print(f"❌ Error con Rekognition: {e}")
        
        return True
        
    except NoCredentialsError:
        print("❌ No se encontraron credenciales AWS")
        print("💡 Ejecuta: aws configure")
        return False
        
    except ClientError as e:
        print(f"❌ Error de AWS: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def set_aws_environment():
    """Configura variables de entorno AWS desde el archivo config.env"""
    
    print("🌍 Usando configuración por defecto de AWS CLI")
    print("💡 Las credenciales se leen automáticamente de ~/.aws/credentials")

if __name__ == "__main__":
    print("🔑 Configurando AWS para ScanEoFacial...")
    print("=" * 50)
    
    # Configurar variables de entorno
    set_aws_environment()
    
    print("\n🧪 Probando credenciales...")
    print("-" * 30)
    
    # Probar credenciales
    if test_aws_credentials():
        print("\n🎉 ¡AWS configurado correctamente!")
        print("🚀 Puedes usar ScanEoFacial con análisis real")
    else:
        print("\n❌ Problemas con la configuración AWS")
        print("💡 Verifica tus credenciales y permisos")
