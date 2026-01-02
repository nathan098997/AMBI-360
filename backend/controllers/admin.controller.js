// =============================================
// AMBI360 - Admin Controller
// =============================================

const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
const { config } = require('../config/app.config');

// Dashboard - estatísticas gerais
const getDashboardStats = async (req, res) => {
    try {
        // Buscar estatísticas
        const [projectStats] = await executeQuery('SELECT COUNT(*) as total FROM projects WHERE is_active = TRUE');
        const [hotspotStats] = await executeQuery('SELECT COUNT(*) as total FROM hotspots WHERE is_active = TRUE');
        const [userStats] = await executeQuery('SELECT COUNT(*) as total FROM users WHERE is_active = TRUE');
        
        // Projetos mais acessados (últimos 30 dias)
        const topProjects = await executeQuery(`
            SELECT 
                p.id, p.name, p.title,
                COUNT(al.id) as access_count,
                COUNT(DISTINCT al.user_session) as unique_visitors
            FROM projects p
            LEFT JOIN access_logs al ON p.id = al.project_id 
                AND al.accessed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHERE p.is_active = TRUE
            GROUP BY p.id
            ORDER BY access_count DESC
            LIMIT 5
        `);

        // Acessos por dia (últimos 7 dias)
        const dailyAccess = await executeQuery(`
            SELECT 
                DATE(accessed_at) as date,
                COUNT(*) as total_access,
                COUNT(DISTINCT user_session) as unique_visitors
            FROM access_logs
            WHERE accessed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(accessed_at)
            ORDER BY date DESC
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    totalProjects: projectStats.total,
                    totalHotspots: hotspotStats.total,
                    totalUsers: userStats.total
                },
                topProjects,
                dailyAccess
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Listar todos os projetos (admin)
const getAllProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id, p.name, p.title, p.description, 
                p.main_image_url, p.logo_url, p.is_public, p.unlock_order,
                p.created_at, p.updated_at, p.is_active,
                ps.total_hotspots, ps.door_hotspots,
                u.username as created_by_username
            FROM projects_summary ps
            JOIN projects p ON ps.id = p.id
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.created_at DESC
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

// Listar usuários
const getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, username, email, role, created_at, updated_at, is_active
            FROM users
            ORDER BY created_at DESC
        `;
        
        const users = await executeQuery(query);

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Alterar senha de usuário
const changeUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }

        // Verificar se usuário existe
        const checkQuery = 'SELECT id FROM users WHERE id = ? AND is_active = TRUE';
        const users = await executeQuery(checkQuery, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Hash da nova senha
        const rounds = (config && config.security && config.security.bcryptRounds) || 12;
        const passwordHash = await bcrypt.hash(newPassword, rounds);

        // Atualizar senha
        const updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
        await executeQuery(updateQuery, [passwordHash, userId]);

        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Ativar/desativar usuário
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        // Verificar se usuário existe
        const checkQuery = 'SELECT id, is_active FROM users WHERE id = ?';
        const users = await executeQuery(checkQuery, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Atualizar status
        const updateQuery = 'UPDATE users SET is_active = ? WHERE id = ?';
        await executeQuery(updateQuery, [isActive, userId]);

        res.json({
            success: true,
            message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`
        });

    } catch (error) {
        console.error('Erro ao alterar status do usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Logs de acesso
const getAccessLogs = async (req, res) => {
    try {
        const { limit = 50, offset = 0, projectId } = req.query;

        let query = `
            SELECT 
                al.id, al.project_id, al.user_session, al.ip_address, 
                al.user_agent, al.accessed_at,
                p.name as project_name, p.title as project_title
            FROM access_logs al
            JOIN projects p ON al.project_id = p.id
        `;
        
        const params = [];
        
        if (projectId) {
            query += ' WHERE al.project_id = ?';
            params.push(projectId);
        }
        
        query += ' ORDER BY al.accessed_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const logs = await executeQuery(query, params);

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getDashboardStats,
    getAllProjects,
    getAllUsers,
    changeUserPassword,
    toggleUserStatus,
    getAccessLogs
};