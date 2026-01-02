// =============================================
// AMBI360 - Progress Controller
// =============================================

const { executeQuery } = require('../config/db');

// Desbloquear hotspot (sistema Google Maps)
const unlockHotspot = async (req, res) => {
    try {
        const { projectId, hotspotId, sessionId } = req.body;

        // Validação básica
        if (!projectId || !hotspotId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'projectId, hotspotId e sessionId são obrigatórios'
            });
        }

        // Verificar se hotspot existe
        const hotspotQuery = `
            SELECT id, unlock_order, requires_previous 
            FROM hotspots 
            WHERE id = ? AND project_id = ? AND is_active = TRUE
        `;
        const hotspots = await executeQuery(hotspotQuery, [hotspotId, projectId]);

        if (hotspots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hotspot não encontrado'
            });
        }

        const hotspot = hotspots[0];

        // Verificar se precisa desbloquear anterior
        if (hotspot.requires_previous && hotspot.unlock_order > 0) {
            const prevQuery = `
                SELECT COUNT(*) as unlocked_count
                FROM user_progress up
                JOIN hotspots h ON up.hotspot_id = h.id
                WHERE up.user_session = ? AND up.project_id = ? 
                AND h.unlock_order < ?
            `;
            const prevResult = await executeQuery(prevQuery, [sessionId, projectId, hotspot.unlock_order]);
            
            if (prevResult[0].unlocked_count === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Você precisa desbloquear os pontos anteriores primeiro'
                });
            }
        }

        // Registrar progresso (INSERT IGNORE para evitar duplicatas)
        const progressQuery = `
            INSERT IGNORE INTO user_progress (user_session, project_id, hotspot_id)
            VALUES (?, ?, ?)
        `;
        await executeQuery(progressQuery, [sessionId, projectId, hotspotId]);

        res.json({
            success: true,
            message: 'Hotspot desbloqueado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao desbloquear hotspot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Buscar progresso do usuário
const getUserProgress = async (req, res) => {
    try {
        const { projectId, sessionId } = req.params;

        const query = `
            SELECT 
                h.id as hotspot_id,
                h.name,
                h.unlock_order,
                up.unlocked_at,
                CASE WHEN up.id IS NOT NULL THEN TRUE ELSE FALSE END as is_unlocked
            FROM hotspots h
            LEFT JOIN user_progress up ON h.id = up.hotspot_id 
                AND up.user_session = ? AND up.project_id = ?
            WHERE h.project_id = ? AND h.is_active = TRUE
            ORDER BY h.unlock_order ASC
        `;
        
        const progress = await executeQuery(query, [sessionId, projectId, projectId]);

        // Calcular estatísticas
        const totalHotspots = progress.length;
        const unlockedHotspots = progress.filter(p => p.is_unlocked).length;
        const progressPercentage = totalHotspots > 0 ? Math.round((unlockedHotspots / totalHotspots) * 100) : 0;

        res.json({
            success: true,
            data: {
                progress: progress,
                stats: {
                    total: totalHotspots,
                    unlocked: unlockedHotspots,
                    percentage: progressPercentage
                }
            }
        });

    } catch (error) {
        console.error('Erro ao buscar progresso:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Resetar progresso do usuário
const resetUserProgress = async (req, res) => {
    try {
        const { projectId, sessionId } = req.params;

        const query = 'DELETE FROM user_progress WHERE project_id = ? AND user_session = ?';
        const result = await executeQuery(query, [projectId, sessionId]);

        res.json({
            success: true,
            message: 'Progresso resetado com sucesso',
            data: {
                deletedRecords: result.affectedRows
            }
        });

    } catch (error) {
        console.error('Erro ao resetar progresso:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    unlockHotspot,
    getUserProgress,
    resetUserProgress
};