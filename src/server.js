const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');

const app = express();

// Middleware para parsear JSON en el body de las peticiones
app.use(express.json());

// ==========================================
// PROYECTO INTEGRADOR: Sistema de Logs
// ==========================================
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'app.log');

// Crear carpeta de logs si no existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Función auxiliar para escribir logs en el archivo app.log
 * @param {string} message - Mensaje a registrar
 */
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  fs.appendFile(LOG_FILE, logEntry, (err) => {
    if (err) {
      console.error('Error al escribir en el log:', err);
    }
  });
}

// Middleware de logging extendido: registra cada petición HTTP
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Capturar el método original res.end para registrar el código de respuesta
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const logMessage = `${req.method} ${req.url} | IP: ${ip} | Status: ${res.statusCode} | ${duration}ms`;
    
    writeLog(logMessage);
    console.log(`[${new Date().toISOString()}] ${logMessage}`);
    
    originalEnd.apply(res, args);
  };
  
  next();
});

// ==========================================
// PROYECTO INTEGRADOR: Sistema de Archivos
// ==========================================
const DATA_DIR = path.join(__dirname, '..', 'data');

// Crear carpeta de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';

// Middleware simple de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ruta principal: información del sistema/entorno
app.get('/', (req, res) => {
  res.send(`
    <h1>SO - CI/CD App</h1>
    <p><strong>Sistema operativo:</strong> ${os.type()} ${os.release()}</p>
    <p><strong>Arquitectura:</strong> ${os.arch()}</p>
    <p><strong>Hostname:</strong> ${os.hostname()}</p>
    <p><strong>NODE_ENV:</strong> ${NODE_ENV}</p>
    <p><strong>APP_VERSION:</strong> ${APP_VERSION}</p>
  `);
});

// Endpoint 1: /env - muestra algunas variables de entorno
app.get('/env', (req, res) => {
  res.json({
    nodeEnv: NODE_ENV,
    appVersion: APP_VERSION,
    platform: os.platform(),
    pid: process.pid
  });
});

// Endpoint 2: /health - endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// PROYECTO INTEGRADOR: Endpoints de Archivos
// ==========================================

/**
 * GET /files - Lista todos los archivos en la carpeta data/
 */
app.get('/files', async (req, res) => {
  try {
    const files = await fsPromises.readdir(DATA_DIR);
    res.json({
      success: true,
      count: files.length,
      files: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al leer el directorio de archivos',
      message: error.message
    });
  }
});

/**
 * POST /files - Crea un nuevo archivo en la carpeta data/
 * Body esperado: { "filename": "nombre.txt", "content": "contenido del archivo" }
 */
app.post('/files', async (req, res) => {
  try {
    const { filename, content } = req.body;
    
    // Validar que se proporcionen filename y content
    if (!filename || content === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: filename y content'
      });
    }
    
    // Validar que el filename no contenga path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo inválido'
      });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    await fsPromises.writeFile(filePath, content, 'utf8');
    
    res.status(201).json({
      success: true,
      message: `Archivo '${filename}' creado exitosamente`,
      filename: filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear el archivo',
      message: error.message
    });
  }
});

/**
 * GET /files/:name - Obtiene el contenido de un archivo específico
 */
app.get('/files/:name', async (req, res) => {
  try {
    const filename = req.params.name;
    
    // Validar que el filename no contenga path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de archivo inválido'
      });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    
    // Verificar que el archivo exista
    try {
      await fsPromises.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: `Archivo '${filename}' no encontrado`
      });
    }
    
    const content = await fsPromises.readFile(filePath, 'utf8');
    
    res.json({
      success: true,
      filename: filename,
      content: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al leer el archivo',
      message: error.message
    });
  }
});


// Solo arrancar el servidor si este archivo es el entrypoint
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT} (NODE_ENV=${NODE_ENV})`);
  });
}

// Exportar app para testing
module.exports = app;
