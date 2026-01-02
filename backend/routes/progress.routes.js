// =============================================
// AMBI360 - Progress Routes
// =============================================

const express = require('express');
const router = express.Router();
const {
    unlockHotspot,
    getUserProgress,
    resetUserProgress
} = require('../controllers/progress.controller');
const { validateProgress } = require('../middleware/validation.middleware');

// POST /api/progress/unlock - Desbloquear hotspot
router.post('/unlock', validateProgress, unlockHotspot);

// GET /api/progress/:projectId/:sessionId - Buscar progresso do usuário
router.get('/:projectId/:sessionId', getUserProgress);

// DELETE /api/progress/:projectId/:sessionId - Resetar progresso
router.delete('/:projectId/:sessionId', resetUserProgress);

module.exports = router;