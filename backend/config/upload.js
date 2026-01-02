// =============================================
// AMBI360 - Upload Configuration
// =============================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { config } = require('./app.config');

// Criar diretório de uploads se não existir
const uploadDir = config.upload && config.upload.uploadPath ? config.upload.uploadPath : (process.env.UPLOAD_PATH || './uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'general';
        
        // Organizar por tipo de arquivo
        if (file.fieldname === 'panorama') {
            folder = 'panoramas';
        } else if (file.fieldname === 'logo') {
            folder = 'logos';
        }
        
        const fullPath = path.join(uploadDir, folder);
        
        // Criar pasta se não existir
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        // Gerar nome único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
    // Tipos permitidos
    const allowedTypes = {
        'image/jpeg': true,
        'image/jpg': true,
        'image/png': true,
        'image/webp': true,
        'image/svg+xml': true
    };
    
    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou SVG'), false);
    }
};

// Configuração do multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: (config.upload && config.upload.maxFileSize) || 10 * 1024 * 1024,
        files: (config.upload && config.upload.maxFiles) || 5
    }
});

// Middleware para upload de panorama
const uploadPanorama = upload.single('panorama');

// Middleware para upload de logo
const uploadLogo = upload.single('logo');

// Middleware para múltiplos arquivos
const uploadMultiple = upload.array('files', 5);

// Função para deletar arquivo
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        return false;
    }
};

// Middleware de tratamento de erros de upload
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            const maxBytes = (config.upload && config.upload.maxFileSize) || (10 * 1024 * 1024);
            const maxMB = Math.round(maxBytes / (1024 * 1024));
            return res.status(400).json({
                success: false,
                message: `Arquivo muito grande. Tamanho máximo: ${maxMB}MB`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            const maxFiles = (config.upload && config.upload.maxFiles) || 5;
            return res.status(400).json({
                success: false,
                message: `Muitos arquivos. Máximo permitido: ${maxFiles}`
            });
        }
    }
    
    if (error.message.includes('Tipo de arquivo não permitido')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
};

module.exports = {
    upload,
    uploadPanorama,
    uploadLogo,
    uploadMultiple,
    deleteFile,
    handleUploadError
};