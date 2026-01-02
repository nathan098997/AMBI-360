// =============================================
// AMBI360 - Auth Routes
// =============================================

const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/auth.controller');
const { validateLogin, validateRegister, sanitizeInput } = require('../middleware/validation.middleware');
const { loginRateLimit } = require('../middleware/auth.middleware');

// Aplicar sanitização em todas as rotas
router.use(sanitizeInput);

// POST /api/auth/login - com rate limiting específico
router.post('/login', loginRateLimit, validateLogin, login);

// POST /api/auth/register
router.post('/register', validateRegister, register);

module.exports = router;