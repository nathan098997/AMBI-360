// =============================================
// AMBI360 - Projects Routes
// =============================================

const express = require('express');
const router = express.Router();
const {
    getPublicProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
} = require('../controllers/projects.controller');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');
const { validateProject } = require('../middleware/validation.middleware');

// GET /api/projects - Listar projetos públicos
router.get('/', getPublicProjects);

// GET /api/projects/:id - Buscar projeto por ID
router.get('/:id', optionalAuth, getProjectById);

// POST /api/projects - Criar projeto
router.post('/', createProject);

// PUT /api/projects/:id - Atualizar projeto (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, updateProject);

// DELETE /api/projects/:id - Deletar projeto (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteProject);

module.exports = router;