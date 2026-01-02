// =============================================
// AMBI360 - Upload Routes
// =============================================

const express = require('express');
const router = express.Router();
const {
    uploadPanorama: uploadPanoramaController,
    uploadLogo: uploadLogoController,
    uploadMultiple: uploadMultipleController,
    deleteUploadedFile
} = require('../controllers/upload.controller');
const { 
    uploadPanorama, 
    uploadLogo, 
    uploadMultiple,
    handleUploadError 
} = require('../config/upload');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');

// POST /api/upload/panorama - Upload de panorama 360° (apenas admin)
router.post('/panorama', authenticateToken, requireAdmin, (req, res) => {
    uploadPanorama(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, () => {});
        }
        uploadPanoramaController(req, res);
    });
});

// POST /api/upload/logo - Upload de logo (apenas admin)
router.post('/logo', authenticateToken, requireAdmin, (req, res) => {
    uploadLogo(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, () => {});
        }
        uploadLogoController(req, res);
    });
});

// POST /api/upload/multiple - Upload múltiplo (apenas admin)
router.post('/multiple', authenticateToken, requireAdmin, (req, res) => {
    uploadMultiple(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, () => {});
        }
        uploadMultipleController(req, res);
    });
});

// DELETE /api/upload/:folder/:filename - Deletar arquivo (apenas admin)
router.delete('/:folder/:filename', authenticateToken, requireAdmin, deleteUploadedFile);

module.exports = router;