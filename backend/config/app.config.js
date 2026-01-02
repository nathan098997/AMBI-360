// =============================================
// AMBI360 - Configuração Central
// =============================================

require('dotenv').config();

const config = {
    // Configurações do servidor
    server: {
        port: parseInt(process.env.APP_PORT, 10) || 3001,
        env: process.env.APP_ENV || 'development',
        secretKey: process.env.APP_SECRET_KEY || 'ambi360-secret-key-2024'
    },

    // Configurações do banco de dados
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'ambi360_db',
        charset: 'utf8mb4',
        timezone: '+00:00'
    },

    // Configurações de segurança
    security: {
        jwtSecret: process.env.JWT_SECRET || 'ambi360-jwt-secret-2024',
        jwtExpiration: '24h',
        sessionSecret: process.env.SESSION_SECRET || 'ambi360-session-secret-2024',
        bcryptRounds: 12
    },

    // Configurações de upload
    upload: {
        // maxFileSize aceita um número em bytes ou uma string como '10MB'/'10M'
        maxFileSize: parseSize(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
        maxFiles: parseInt(process.env.MAX_FILES, 10) || 5
    },

    // Configurações de CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Configurações de log
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        debugMode: process.env.DEBUG_MODE === 'true'
    },

    // Configurações da aplicação
    app: {
        name: 'AMBI360',
        version: '1.0.0',
        description: 'Plataforma de Tours Virtuais 360°',
        author: 'Nathan098997',
        maxProjectsPerUser: parseInt(process.env.MAX_PROJECTS_PER_USER) || 10,
        enablePublicAccess: process.env.ENABLE_PUBLIC_ACCESS !== 'false',
        defaultAutoRotate: parseFloat(process.env.DEFAULT_AUTO_ROTATE) || -2
    },

    // URLs e caminhos
    paths: {
        frontend: '../frontend',
        uploads: '../uploads',
        database: './database.sql'
    }
};

// Helper para interpretar tamanhos como '10MB', '5M', ou números em bytes
function parseSize(value) {
    if (!value) return null;
    if (typeof value === 'number') return value;
    const v = String(value).trim().toUpperCase();
    // se já for número puro
    if (/^\d+$/.test(v)) return parseInt(v, 10);
    const match = v.match(/^(\d+(?:\.\d+)?)(B|KB|MB|GB|TB|K|M|G|T)?$/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    const unit = match[2] || 'B';
    switch (unit) {
        case 'B': return Math.round(num);
        case 'KB': case 'K': return Math.round(num * 1024);
        case 'MB': case 'M': return Math.round(num * 1024 * 1024);
        case 'GB': case 'G': return Math.round(num * 1024 * 1024 * 1024);
        case 'TB': case 'T': return Math.round(num * 1024 * 1024 * 1024 * 1024);
        default: return null;
    }
}

// Validar configurações críticas
function validateConfig() {
    const errors = [];

    if (!config.database.password && config.server.env === 'production') {
        errors.push('Senha do banco de dados é obrigatória em produção');
    }

    if (config.security.jwtSecret === 'ambi360-jwt-secret-2024' && config.server.env === 'production') {
        errors.push('JWT_SECRET deve ser alterado em produção');
    }

    if (errors.length > 0) {
        console.error('❌ Erros de configuração:');
        errors.forEach(error => console.error(`  - ${error}`));
        
        if (config.server.env === 'production') {
            process.exit(1);
        } else {
            console.warn('⚠️  Continuando em modo de desenvolvimento...');
        }
    }
}

// Função para obter configuração por categoria
function getConfig(category = null) {
    if (category) {
        return config[category] || {};
    }
    return config;
}

// Função para definir configuração
function setConfig(category, key, value) {
    if (!config[category]) {
        config[category] = {};
    }
    config[category][key] = value;
}

module.exports = {
    config,
    validateConfig,
    getConfig,
    setConfig
};