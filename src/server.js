const express = require('express');
const os = require('os');

const app = express();

// Variables de entorno con valores por defecto
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

// Solo arrancar el servidor si este archivo es el entrypoint
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT} (NODE_ENV=${NODE_ENV})`);
  });
}

// Exportar app para testing
module.exports = app;
