// =============================================
// AMBI360 - Servidor Backend
// =============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/projects', require('./routes/projects'));
app.use('/api/hotspots', require('./routes/hotspots'));
app.use('/api/auth', require('./routes/auth'));

// Rota principal - servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rota de health check
app.get('/api/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
        status: 'ok',
        database: dbStatus ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Algo deu errado!',
        message: process.env.APP_ENV === 'development' ? err.message : 'Erro interno do servidor'
    });
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
async function startServer() {
    try {
        // Testar conexão com banco
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️ Servidor iniciado sem conexão com banco de dados');
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor AMBI360 rodando na porta ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔧 API: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();