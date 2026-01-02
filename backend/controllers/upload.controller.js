// =============================================
// AMBI360 - Upload Controller
// =============================================

const path = require('path');
const { deleteFile } = require('../config/upload');

// Upload de panorama 360°
const uploadPanorama = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }

        // Construir URL do arquivo
        const fileUrl = `/uploads/panoramas/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Panorama enviado com sucesso',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                url: fileUrl,
                fullPath: req.file.path
            }
        });

    } catch (error) {
        console.error('Erro no upload de panorama:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Upload de logo
const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }

        // Construir URL do arquivo
        const fileUrl = `/uploads/logos/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Logo enviado com sucesso',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                url: fileUrl,
                fullPath: req.file.path
            }
        });

    } catch (error) {
        console.error('Erro no upload de logo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Upload múltiplo
const uploadMultiple = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo enviado'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            url: `/uploads/general/${file.filename}`,
            fullPath: file.path
        }));

        res.json({
            success: true,
            message: `${req.files.length} arquivo(s) enviado(s) com sucesso`,
            data: uploadedFiles
        });

    } catch (error) {
        console.error('Erro no upload múltiplo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Deletar arquivo
const deleteUploadedFile = async (req, res) => {
    try {
        const { filename, folder = 'general' } = req.params;
        
        // Construir caminho do arquivo
        const uploadDir = process.env.UPLOAD_PATH || './uploads';
        const filePath = path.join(uploadDir, folder, filename);
        
        // Deletar arquivo
        const deleted = deleteFile(filePath);
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Arquivo deletado com sucesso'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Arquivo não encontrado'
            });
        }

    } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    uploadPanorama,
    uploadLogo,
    uploadMultiple,
    deleteUploadedFile
};