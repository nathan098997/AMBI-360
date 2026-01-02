// =============================================
// AMBI360 - Admin Routes
// =============================================

const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllProjects,
    getAllUsers,
    changeUserPassword,
    toggleUserStatus,
    getAccessLogs
} = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

// Aplicar middleware de autenticação e admin em todas as rotas
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Estatísticas do dashboard
router.get('/dashboard', getDashboardStats);

// GET /api/admin/projects - Listar todos os projetos
router.get('/projects', getAllProjects);

// GET /api/admin/users - Listar usuários
router.get('/users', getAllUsers);

// PUT /api/admin/users/:userId/password - Alterar senha de usuário
router.put('/users/:userId/password', changeUserPassword);

// PUT /api/admin/users/:userId/status - Ativar/desativar usuário
router.put('/users/:userId/status', toggleUserStatus);

// GET /api/admin/logs - Logs de acesso
router.get('/logs', getAccessLogs);

module.exports = router;