// =============================================
// AMBI360 - Servidor Backend
// =============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { testConnection } = require('./config/db');
const { config, validateConfig } = require('./config/app.config');
const { createRateLimit } = require('./middleware/auth.middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.APP_PORT || config.server.port || 3001;

// Validar configurações
validateConfig();

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.pannellum.org"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.pannellum.org"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting global
app.use(createRateLimit());

// Compressão
app.use(compression());

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON e URL encoded
app.use(express.json({ 
    limit: process.env.MAX_FILE_SIZE || '10mb',
    strict: true
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.MAX_FILE_SIZE || '10mb'
}));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, config.paths.frontend), {
    maxAge: '1d',
    etag: true
}));

// Servir arquivos de upload
app.use('/uploads', express.static(path.join(__dirname, config.paths.uploads), {
    maxAge: '7d',
    etag: true
}));

// Rotas da API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/hotspots', require('./routes/hotspots.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/upload', require('./routes/upload.routes'));

// Rota principal - servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, config.paths.frontend, 'index.html'));
});

// Rota de health check
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await testConnection();
        res.json({
            status: 'ok',
            app: {
                name: config.app.name,
                version: config.app.version,
                env: process.env.NODE_ENV || config.server.env
            },
            database: dbStatus ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro no health check:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err.stack);
    
    // Não vazar informações sensíveis em produção
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        success: false,
        message: isDevelopment ? err.message : 'Erro interno do servidor',
        ...(isDevelopment && { stack: err.stack })
    });
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Rota não encontrada' 
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, encerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
async function startServer() {
    try {
        // Testar conexão com banco
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️ Servidor iniciado sem conexão com banco de dados');
        }
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 ${config.app.name} v${config.app.version} rodando na porta ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔧 API: http://localhost:${PORT}/api`);
            console.log(`📚 Docs: Veja API_DOCUMENTATION.md`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || config.server.env}`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();