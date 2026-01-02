// =============================================
// AMBI360 - Validation Middleware
// =============================================

const { body, validationResult } = require('express-validator');

// Middleware para processar resultados de validação
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array().map(err => err.msg)
        });
    }
    next();
};

// Validações para projeto
const validateProject = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Nome do projeto é obrigatório')
        .isLength({ min: 1, max: 100 })
        .withMessage('Nome deve ter entre 1 e 100 caracteres')
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Nome deve conter apenas letras, números, espaços, hífens e underscores'),
    
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Título é obrigatório')
        .isLength({ min: 1, max: 200 })
        .withMessage('Título deve ter entre 1 e 200 caracteres'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Descrição deve ter no máximo 1000 caracteres'),
    
    body('main_image_url')
        .trim()
        .notEmpty()
        .withMessage('URL da imagem principal é obrigatória')
        .isURL()
        .withMessage('URL da imagem deve ser válida'),
    
    body('logo_url')
        .optional()
        .trim()
        .isURL()
        .withMessage('URL do logo deve ser válida'),
    
    handleValidationErrors
];

// Validações para hotspot
const validateHotspot = [
    body('project_id')
        .isInt({ min: 1 })
        .withMessage('ID do projeto deve ser um número inteiro positivo'),
    
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Nome do hotspot é obrigatório')
        .isLength({ min: 1, max: 100 })
        .withMessage('Nome deve ter entre 1 e 100 caracteres'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Descrição deve ter no máximo 500 caracteres'),
    
    body('pitch')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Pitch deve ser um número entre -90 e 90'),
    
    body('yaw')
        .isFloat({ min: 0, max: 359.99 })
        .withMessage('Yaw deve ser um número entre 0 e 359.99'),
    
    body('hotspot_type')
        .optional()
        .isIn(['normal', 'door', 'info', 'custom'])
        .withMessage('Tipo de hotspot inválido'),
    
    body('target_image_url')
        .optional()
        .trim()
        .isURL()
        .withMessage('URL da imagem de destino deve ser válida'),
    
    handleValidationErrors
];

// Validações para login
const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username é obrigatório')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username deve ter entre 3 e 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username deve conter apenas letras, números e underscores'),
    
    body('password')
        .notEmpty()
        .withMessage('Password é obrigatório')
        .isLength({ min: 6 })
        .withMessage('Password deve ter pelo menos 6 caracteres'),
    
    handleValidationErrors
];

// Validações para registro
const validateRegister = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username é obrigatório')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username deve ter entre 3 e 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username deve conter apenas letras, números e underscores'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email é obrigatório')
        .isEmail()
        .withMessage('Email deve ser válido')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password é obrigatório')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password deve ter entre 6 e 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        .withMessage('Password deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
    
    body('role')
        .optional()
        .isIn(['admin', 'user'])
        .withMessage('Role deve ser admin ou user'),
    
    handleValidationErrors
];

// Validações para progresso
const validateProgress = [
    body('projectId')
        .isInt({ min: 1 })
        .withMessage('ID do projeto deve ser um número inteiro positivo'),
    
    body('hotspotId')
        .isInt({ min: 1 })
        .withMessage('ID do hotspot deve ser um número inteiro positivo'),
    
    body('sessionId')
        .trim()
        .notEmpty()
        .withMessage('Session ID é obrigatório')
        .isLength({ min: 10, max: 100 })
        .withMessage('Session ID deve ter entre 10 e 100 caracteres')
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage('Session ID deve conter apenas caracteres alfanuméricos, hífens e underscores'),
    
    handleValidationErrors
];

// Validação para upload
const validateUpload = [
    body('type')
        .optional()
        .isIn(['panorama', 'logo', 'general'])
        .withMessage('Tipo de upload inválido'),
    
    handleValidationErrors
];

// Sanitização geral de entrada
const sanitizeInput = (req, res, next) => {
    // Remove caracteres perigosos de strings
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .trim();
    };

    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }

    // Sanitizar query params
    if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }

    next();
};

module.exports = {
    validateProject,
    validateHotspot,
    validateLogin,
    validateRegister,
    validateProgress,
    validateUpload,
    sanitizeInput,
    handleValidationErrors
};