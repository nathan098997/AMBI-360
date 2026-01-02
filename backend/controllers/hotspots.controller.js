// =============================================
// AMBI360 - Hotspots Controller
// =============================================

const { executeQuery } = require('../config/db');

// Buscar hotspots por projeto
const getHotspotsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const query = `
            SELECT 
                id, project_id, parent_hotspot_id, name, description,
                pitch, yaw, hotspot_type, icon_type, target_image_url,
                unlock_order, requires_previous, created_at
            FROM hotspots 
            WHERE project_id = ? AND is_active = TRUE
            ORDER BY unlock_order ASC, created_at ASC
        `;
        
        const hotspots = await executeQuery(query, [projectId]);

        res.json({
            success: true,
            data: hotspots
        });

    } catch (error) {
        console.error('Erro ao buscar hotspots:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Criar hotspot
const createHotspot = async (req, res) => {
    try {
        const {
            project_id, parent_hotspot_id, name, description,
            pitch, yaw, hotspot_type = 'normal', icon_type = 'normal_1',
            target_image_url, unlock_order = 0, requires_previous = false
        } = req.body;

        // Validação básica
        if (!project_id || !name || pitch === undefined || yaw === undefined) {
            return res.status(400).json({
                success: false,
                message: 'project_id, name, pitch e yaw são obrigatórios'
            });
        }

        // Verificar se projeto existe
        const projectQuery = 'SELECT id FROM projects WHERE id = ? AND is_active = TRUE';
        const projects = await executeQuery(projectQuery, [project_id]);

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Projeto não encontrado'
            });
        }

        // Verificar parent_hotspot se fornecido
        if (parent_hotspot_id) {
            const parentQuery = 'SELECT id FROM hotspots WHERE id = ? AND project_id = ? AND is_active = TRUE';
            const parents = await executeQuery(parentQuery, [parent_hotspot_id, project_id]);

            if (parents.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Hotspot pai não encontrado'
                });
            }
        }

        // Inserir hotspot
        const insertQuery = `
            INSERT INTO hotspots 
            (project_id, parent_hotspot_id, name, description, pitch, yaw, 
             hotspot_type, icon_type, target_image_url, unlock_order, requires_previous)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await executeQuery(insertQuery, [
            project_id, parent_hotspot_id, name, description, pitch, yaw,
            hotspot_type, icon_type, target_image_url, unlock_order, requires_previous
        ]);

        res.status(201).json({
            success: true,
            message: 'Hotspot criado com sucesso',
            data: {
                id: result.insertId,
                project_id,
                name
            }
        });

    } catch (error) {
        console.error('Erro ao criar hotspot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar hotspot
const updateHotspot = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, pitch, yaw, hotspot_type,
            icon_type, target_image_url, unlock_order, requires_previous
        } = req.body;

        // Verificar se hotspot existe
        const checkQuery = 'SELECT id FROM hotspots WHERE id = ? AND is_active = TRUE';
        const existing = await executeQuery(checkQuery, [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hotspot não encontrado'
            });
        }

        // Preparar campos para atualização
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (pitch !== undefined) {
            updates.push('pitch = ?');
            values.push(pitch);
        }
        if (yaw !== undefined) {
            updates.push('yaw = ?');
            values.push(yaw);
        }
        if (hotspot_type !== undefined) {
            updates.push('hotspot_type = ?');
            values.push(hotspot_type);
        }
        if (icon_type !== undefined) {
            updates.push('icon_type = ?');
            values.push(icon_type);
        }
        if (target_image_url !== undefined) {
            updates.push('target_image_url = ?');
            values.push(target_image_url);
        }
        if (unlock_order !== undefined) {
            updates.push('unlock_order = ?');
            values.push(unlock_order);
        }
        if (requires_previous !== undefined) {
            updates.push('requires_previous = ?');
            values.push(requires_previous);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo para atualizar'
            });
        }

        values.push(id);
        const updateQuery = `UPDATE hotspots SET ${updates.join(', ')} WHERE id = ?`;
        
        await executeQuery(updateQuery, values);

        res.json({
            success: true,
            message: 'Hotspot atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar hotspot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Deletar hotspot
const deleteHotspot = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete
        const query = 'UPDATE hotspots SET is_active = FALSE WHERE id = ?';
        const result = await executeQuery(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hotspot não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Hotspot deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar hotspot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getHotspotsByProject,
    createHotspot,
    updateHotspot,
    deleteHotspot
};