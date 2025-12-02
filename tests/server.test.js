const request = require('supertest');
const app = require('../src/server');
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');

// Directorio de pruebas para archivos
const TEST_DATA_DIR = path.join(__dirname, '..', 'data');

describe('SO CI/CD App - Endpoints', () => {
  test('GET / debe responder 200 y contener el título', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('SO - CI/CD App');
  });

  test('GET /env debe responder con JSON y contener nodeEnv y appVersion', async () => {
    const res = await request(app).get('/env');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('nodeEnv');
    expect(res.body).toHaveProperty('appVersion');
  });

  test('GET /health debe responder con status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

// ==========================================
// PROYECTO INTEGRADOR: Tests de Sistema de Archivos
// ==========================================
describe('Sistema de Archivos - Endpoints /files', () => {
  
  // Limpiar archivos de prueba antes de cada test
  beforeEach(async () => {
    // Asegurar que el directorio existe
    if (!fs.existsSync(TEST_DATA_DIR)) {
      await fsPromises.mkdir(TEST_DATA_DIR, { recursive: true });
    }
    
    // Limpiar archivos de prueba anteriores
    const files = await fsPromises.readdir(TEST_DATA_DIR);
    for (const file of files) {
      if (file.startsWith('test-') || file.startsWith('ejemplo-')) {
        await fsPromises.unlink(path.join(TEST_DATA_DIR, file));
      }
    }
  });

  test('GET /files debe responder con lista de archivos (puede estar vacía)', async () => {
    const res = await request(app).get('/files');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('files');
    expect(Array.isArray(res.body.files)).toBe(true);
  });

  test('POST /files debe crear un archivo correctamente', async () => {
    const testData = {
      filename: 'test-file.txt',
      content: 'Este es un contenido de prueba'
    };

    const res = await request(app)
      .post('/files')
      .send(testData)
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('filename', 'test-file.txt');
    expect(res.body.message).toContain('creado exitosamente');

    // Verificar que el archivo realmente se creó
    const filePath = path.join(TEST_DATA_DIR, 'test-file.txt');
    expect(fs.existsSync(filePath)).toBe(true);
    
    const content = await fsPromises.readFile(filePath, 'utf8');
    expect(content).toBe(testData.content);
  });

  test('POST /files debe fallar si faltan parámetros', async () => {
    const res = await request(app)
      .post('/files')
      .send({ filename: 'test.txt' }) // Falta content
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toContain('Faltan parámetros');
  });

  test('POST /files debe rechazar nombres de archivo inválidos', async () => {
    const res = await request(app)
      .post('/files')
      .send({ filename: '../malicious.txt', content: 'hack' })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toContain('inválido');
  });

  test('GET /files/:name debe devolver el contenido del archivo', async () => {
    // Primero crear un archivo
    const testData = {
      filename: 'test-read.txt',
      content: 'Contenido para lectura'
    };

    await request(app)
      .post('/files')
      .send(testData)
      .set('Content-Type', 'application/json');

    // Ahora leerlo
    const res = await request(app).get(`/files/${testData.filename}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('filename', testData.filename);
    expect(res.body).toHaveProperty('content', testData.content);
  });

  test('GET /files/:name debe devolver 404 si el archivo no existe', async () => {
    const res = await request(app).get('/files/archivo-inexistente.txt');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toContain('no encontrado');
  });

  test('GET /files/:name debe rechazar nombres de archivo inválidos', async () => {
    // Probar con un nombre que contenga caracteres inválidos directamente en el parámetro
    const res = await request(app).get('/files/..%2Fmalicious.txt');

    // Express puede normalizar la URL, así que verificamos que el archivo no se lea
    // Puede devolver 404 (no encontrado) o 400 (inválido), ambos son válidos
    expect([400, 404]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /files debe incluir archivos creados en tests anteriores', async () => {
    // Crear varios archivos
    await request(app)
      .post('/files')
      .send({ filename: 'ejemplo-1.txt', content: 'contenido 1' });
    
    await request(app)
      .post('/files')
      .send({ filename: 'ejemplo-2.txt', content: 'contenido 2' });

    // Listar archivos
    const res = await request(app).get('/files');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.files).toContain('ejemplo-1.txt');
    expect(res.body.files).toContain('ejemplo-2.txt');
    expect(res.body.count).toBeGreaterThanOrEqual(2);
  });

  // Limpiar después de todos los tests
  afterAll(async () => {
    const files = await fsPromises.readdir(TEST_DATA_DIR);
    for (const file of files) {
      if (file.startsWith('test-') || file.startsWith('ejemplo-')) {
        await fsPromises.unlink(path.join(TEST_DATA_DIR, file));
      }
    }
  });
});
