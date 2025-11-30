import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      )
    }

    // Decodificar la imagen base64
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Guardar la imagen temporalmente
    const tempImagePath = path.join(process.cwd(), 'temp_face.jpg')
    require('fs').writeFileSync(tempImagePath, buffer)

    // Ejecutar el script Python
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), '..', 'reconocimiento_api.py'),
      '--image',
      tempImagePath
    ])

    return new Promise((resolve) => {
      let result = ''
      let error = ''

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString()
      })

      pythonProcess.on('close', (code) => {
        // Limpiar archivo temporal
        try {
          require('fs').unlinkSync(tempImagePath)
        } catch (e) {
          console.error('Error eliminando archivo temporal:', e)
        }

        if (code !== 0) {
          resolve(NextResponse.json(
            { error: `Error en análisis Python: ${error}` },
            { status: 500 }
          ))
          return
        }

        // Parsear el resultado del Python
        try {
          const analysisResult = parsePythonOutput(result)
          resolve(NextResponse.json(analysisResult))
        } catch (parseError) {
          resolve(NextResponse.json(
            { error: 'Error parseando resultado de Python' },
            { status: 500 }
          ))
        }
      })
    })

  } catch (error) {
    console.error('Error en API route:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function parsePythonOutput(output: string) {
  // Buscar patrones en la salida del Python
  const emotionMatch = output.match(/Emoción dominante:\s*(\w+)/)
  const genderMatch = output.match(/Género:\s*(\w+)/)
  const ageMatch = output.match(/Rango de edad:\s*(\d+)-(\d+)/)
  const confidenceMatch = output.match(/Confianza:\s*([\d.]+)/)

  return {
    emotion: emotionMatch ? emotionMatch[1] : 'DESCONOCIDA',
    gender: genderMatch ? genderMatch[1] : 'No detectado',
    ageRange: ageMatch ? { low: parseInt(ageMatch[1]), high: parseInt(ageMatch[2]) } : null,
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0,
    rawOutput: output
  }
}
