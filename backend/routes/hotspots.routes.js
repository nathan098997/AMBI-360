// =============================================
// AMBI360 - Hotspots Routes
// =============================================

const express = require('express');
const router = express.Router();
const {
    getHotspotsByProject,
    createHotspot,
    updateHotspot,
    deleteHotspot
} = require('../controllers/hotspots.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const { validateHotspot } = require('../middleware/validation.middleware');

// GET /api/hotspots/project/:projectId - Buscar hotspots por projeto
router.get('/project/:projectId', getHotspotsByProject);

// POST /api/hotspots - Criar hotspot (apenas admin)
router.post('/', authenticateToken, requireAdmin, validateHotspot, createHotspot);

// PUT /api/hotspots/:id - Atualizar hotspot (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, updateHotspot);

// DELETE /api/hotspots/:id - Deletar hotspot (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteHotspot);

module.exports = router;