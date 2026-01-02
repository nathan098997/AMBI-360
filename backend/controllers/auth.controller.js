// =============================================
// AMBI360 - Auth Controller
// =============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/db');
const { config } = require('../config/app.config');

// Login de usuário
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validação básica
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username e password são obrigatórios'
            });
        }

        // Validação de formato
        if (username.length < 3 || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Username deve ter pelo menos 3 caracteres e senha pelo menos 6'
            });
        }

        // Buscar usuário no banco
        const query = 'SELECT id, username, email, password_hash, role FROM users WHERE username = ? AND is_active = TRUE';
        const users = await executeQuery(query, [username]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const user = users[0];

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Gerar JWT token
        const jwtSecret = process.env.JWT_SECRET || config?.security?.jwtSecret;
        if (!jwtSecret) {
            console.error('JWT_SECRET não configurado');
            return res.status(500).json({
                success: false,
                message: 'Erro de configuração do servidor'
            });
        }

        const jwtExpiry = process.env.JWT_EXPIRES_IN || config?.security?.jwtExpiration || '24h';
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            jwtSecret,
            { expiresIn: jwtExpiry }
        );

        // Remover password_hash da resposta
        delete user.password_hash;

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Registro de usuário
const register = async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;

        // Validação básica
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email e password são obrigatórios'
            });
        }

        // Validação de formato
        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username deve ter pelo menos 3 caracteres'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password deve ter pelo menos 6 caracteres'
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // Verificar se usuário já existe
        const checkQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
        const existingUsers = await executeQuery(checkQuery, [username, email]);

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username ou email já existe'
            });
        }

        // Hash da senha
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || config?.security?.bcryptRounds || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Inserir usuário
        const insertQuery = `
            INSERT INTO users (username, email, password_hash, role) 
            VALUES (?, ?, ?, ?)
        `;
        const result = await executeQuery(insertQuery, [username, email, passwordHash, role]);

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: {
                userId: result.insertId,
                username,
                email,
                role
            }
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    login,
    register
};