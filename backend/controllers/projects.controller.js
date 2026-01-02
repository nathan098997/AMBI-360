// =============================================
// AMBI360 - Projects Controller
// =============================================

const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
const { config } = require('../config/app.config');

// Listar projetos públicos
const getPublicProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, p.name, p.title, p.description, 
                p.main_image_url, p.logo_url, p.unlock_order,
                p.created_at, ps.total_hotspots, ps.door_hotspots
            FROM projects_summary ps
            JOIN projects p ON ps.id = p.id
            WHERE p.is_public = TRUE AND p.is_active = TRUE
            ORDER BY p.unlock_order ASC, p.created_at DESC
        `;
        
        const projects = await executeQuery(query);

        res.json({
            success: true,
            data: projects
        });

    } catch (error) {
        console.error('Erro ao buscar projetos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Buscar projeto por ID
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionId } = req.query;

        const query = `
            SELECT 
                id, name, title, description, main_image_url, 
                logo_url, unlock_order, created_at,
                password_hash IS NOT NULL as has_password
            FROM projects 
            WHERE id = ? AND is_active = TRUE
        `;
        
        const projects = await executeQuery(query, [id]);

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        const project = projects[0];

        // Registrar acesso
        if (sessionId) {
            const logQuery = `
                INSERT INTO access_logs (project_id, user_session, ip_address, user_agent)
                VALUES (?, ?, ?, ?)
            `;
            await executeQuery(logQuery, [
                id, 
                sessionId, 
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent') || 'Unknown'
            ]);
        }

        res.json({
            success: true,
            data: project
        });

    } catch (error) {
        console.error('Erro ao buscar projeto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Criar projeto
const createProject = async (req, res) => {
    try {
        const { 
            name, title, description, main_image_url, 
            logo_url, is_public = true, unlock_order = 0 
        } = req.body;

        const insertQuery = `
            INSERT INTO projects 
            (name, title, description, main_image_url, logo_url, is_public, unlock_order, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(insertQuery, [
            name, title, description || '', main_image_url, logo_url || null, 
            is_public, unlock_order, 1
        ]);

        res.status(201).json({
            success: true,
            message: 'Projeto criado com sucesso',
            data: {
                id: result.insertId,
                name,
                title
            }
        });

    } catch (error) {
        console.error('Erro ao criar projeto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar projeto
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, title, description, main_image_url, 
            logo_url, password, is_public, unlock_order 
        } = req.body;

        // Verificar se projeto existe
        const checkQuery = 'SELECT id FROM projects WHERE id = ? AND is_active = TRUE';
        const existing = await executeQuery(checkQuery, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        // Preparar campos para atualização
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (main_image_url !== undefined) {
            updates.push('main_image_url = ?');
            values.push(main_image_url);
        }
        if (logo_url !== undefined) {
            updates.push('logo_url = ?');
            values.push(logo_url);
        }
        if (is_public !== undefined) {
            updates.push('is_public = ?');
            values.push(is_public);
        }
        if (unlock_order !== undefined) {
            updates.push('unlock_order = ?');
            values.push(unlock_order);
        }
        if (password !== undefined) {
            const rounds = (config && config.security && config.security.bcryptRounds) || 12;
            const passwordHash = password ? await bcrypt.hash(password, rounds) : null;
            updates.push('password_hash = ?');
            values.push(passwordHash);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }

        values.push(id);
        const updateQuery = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
        
        await executeQuery(updateQuery, values);

        res.json({
            success: true,
            message: 'Projeto atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Deletar projeto
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete
        const query = 'UPDATE projects SET is_active = FALSE WHERE id = ?';
        const result = await executeQuery(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Projeto deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar projeto:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getPublicProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};