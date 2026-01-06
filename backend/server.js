// =============================================
// AMBI360 - Servidor Backend
// =============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.APP_PORT || 3005;

// Função simples para testar conexão
const testConnection = async () => {
    try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ambi360_db'
        });
        await connection.end();
        return true;
    } catch (error) {
        console.warn('⚠️ Banco de dados não conectado:', error.message);
        return false;
    }
};

// Rate limiting simples
const createRateLimit = () => {
    const rateLimit = require('express-rate-limit');
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { success: false, message: 'Muitas tentativas' }
    });
};

// Configuração básica
const config = {
    app: { name: 'AMBI360', version: '1.0.0' },
    server: { env: process.env.NODE_ENV || 'development' },
    paths: { frontend: '../frontend', uploads: '../uploads' }
};

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: false // Desabilitar temporariamente para desenvolvimento
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

// Rotas da API (com tratamento de erro)
try {
    app.use('/api/auth', require('./routes/auth.routes'));
    app.use('/api/projects', require('./routes/projects.routes'));
    app.use('/api/hotspots', require('./routes/hotspots.routes'));
    app.use('/api/progress', require('./routes/progress.routes'));
    app.use('/api/admin', require('./routes/admin.routes'));
    app.use('/api/upload', require('./routes/upload.routes'));
} catch (error) {
    console.warn('⚠️ Algumas rotas da API não puderam ser carregadas:', error.message);
}

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
                env: process.env.NODE_ENV || 'development'
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
    console.log('\n🔄 SIGTERM recebido, encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🔄 SIGINT recebido, encerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
async function startServer() {
    try {
        // Testar conexão com banco
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️ Servidor iniciado sem conexão com banco de dados');
            console.warn('⚠️ Funcionando apenas com localStorage no frontend');
        } else {
            console.log('✅ Banco de dados conectado');
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 ${config.app.name} v${config.app.version} rodando na porta ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔧 API: http://localhost:${PORT}/api`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('\n=== INSTRUÇÕES ===');
            console.log('1. Acesse: http://localhost:' + PORT);
            console.log('2. Senha admin: admin123');
            console.log('3. Crie seus projetos 360°');
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();