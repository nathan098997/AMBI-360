// =============================================
// AMBI360 - Auth Middleware
// =============================================

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { config } = require('../config/app.config');

// Rate limiting
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: 'Muitas tentativas. Tente novamente em alguns minutos.'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// Rate limit específico para login
const loginRateLimit = createRateLimit(15 * 60 * 1000, 5);

// Middleware para verificar JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acesso requerido'
            });
        }

        const jwtSecret = process.env.JWT_SECRET || config?.security?.jwtSecret;
        if (!jwtSecret) {
            console.error('JWT_SECRET não configurado');
            return res.status(500).json({
                success: false,
                message: 'Erro de configuração do servidor'
            });
        }

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token inválido ou expirado'
                });
            }
            
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Permissão de administrador requerida'
            });
        }
        next();
    } catch (error) {
        console.error('Erro no middleware de admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Middleware opcional de autenticação (não bloqueia se não tiver token)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const jwtSecret = process.env.JWT_SECRET || config?.security?.jwtSecret;
            if (jwtSecret) {
                jwt.verify(token, jwtSecret, (err, user) => {
                    if (!err) {
                        req.user = user;
                    }
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Erro no middleware de autenticação opcional:', error);
        next(); // Continua mesmo com erro
    }
};

// Middleware de validação de entrada
const validateInput = (req, res, next) => {
    // Sanitizar entrada básica
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        }
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth,
    validateInput,
    createRateLimit,
    loginRateLimit
};