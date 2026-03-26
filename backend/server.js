require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ─────────────────────────────────────────────────────────────
//  SEGURIDAD — HELMET
//  Agrega ~14 headers de seguridad automáticamente
// ─────────────────────────────────────────────────────────────
app.use(helmet());

// ─────────────────────────────────────────────────────────────
//  CORS — solo permite el frontend oficial
//  (ya no es origin:'*')
// ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://happybodyclinicandspa.netlify.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://127.0.0.1:8080',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin origin (curl, Postman, apps móviles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('No permitido por CORS'));
  },
  methods: ['GET','POST','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false,
}));

// ─────────────────────────────────────────────────────────────
//  RATE LIMITING
//  Global: 120 requests / 15 min por IP
//  Más estricto para creación de citas: 20 / 15 min
// ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones. Intenta en unos minutos.' },
});
app.use(globalLimiter);

const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos de agendar. Espera 15 minutos.' },
});

// ─────────────────────────────────────────────────────────────
//  BODY PARSER — límite 10kb
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─────────────────────────────────────────────────────────────
//  CONEXIÓN A MONGODB
// ─────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Error MongoDB:', err.message);
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB desconectado — reintentando...');
  setTimeout(connectDB, 3000);
});

// ─────────────────────────────────────────────────────────────
//  RUTAS
// ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const s = mongoose.connection.readyState;
  res.json({
    ok: s === 1,
    db: ({0:'disconnected',1:'connected',2:'connecting',3:'disconnecting'})[s],
    ts: new Date().toISOString(),
  });
});

// ⚠️ Endpoint /seed protegido con clave secreta
// Para ejecutar: GET /seed?key=TU_SEED_KEY (solo funciona con la clave correcta)
app.get('/seed', async (req, res) => {
  const key = process.env.SEED_KEY;
  if (!key || req.query.key !== key) {
    return res.status(403).json({ ok: false, error: 'No autorizado' });
  }
  try {
    const runSeed = require('./seed/seedData');
    await runSeed();
    res.json({ ok: true, message: 'Seed ejecutado correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/services',     require('./routes/services'));
app.use('/api/specialists',  require('./routes/specialists'));
app.use('/api/appointments', appointmentLimiter, require('./routes/appointments'));

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Ruta ${req.method} ${req.path} no existe` });
});

// Error handler global
app.use((err, req, res, next) => {
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ ok: false, error: 'Origen no permitido' });
  }
  console.error('💥 Error:', err.message);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

// ─────────────────────────────────────────────────────────────
//  ARRANCAR
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Env: ${process.env.NODE_ENV || 'development'}`);
  });
});
