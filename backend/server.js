require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ─────────────────────────────────────────────────────────────
//  SEGURIDAD & MIDDLEWARE
// ─────────────────────────────────────────────────────────────
app.use(helmet());

// CORS: permite peticiones desde el frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://127.0.0.1:8080', // 🔥 ESTE ES EL QUE FALTA
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`⚠️  CORS bloqueado para origen: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  methods:     ['GET', 'POST', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

// Rate limiting: máximo 120 requests por IP cada 15 minutos
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      120,
  message:  { ok: false, error: 'Demasiadas peticiones, intenta en unos minutos' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

app.use(express.json({ limit: '10kb' }));

// ─────────────────────────────────────────────────────────────
//  CONEXIÓN A MONGODB
// ─────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          45000,
    });
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    // Reintentar en 5 segundos
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconectado — reintentando...');
  setTimeout(connectDB, 3000);
});

// ─────────────────────────────────────────────────────────────
//  RUTAS
// ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states  = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({
    ok:        dbState === 1,
    status:    'ok',
    db:        states[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

app.use('/api/services',      require('./routes/services'));
app.use('/api/specialists',   require('./routes/specialists'));
app.use('/api/appointments',  require('./routes/appointments'));

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Ruta ${req.method} ${req.path} no existe` });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err.message);
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ ok: false, error: 'CORS: origen no permitido' });
  }
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

// ─────────────────────────────────────────────────────────────
//  ARRANCAR SERVIDOR
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
});
