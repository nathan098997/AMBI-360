// =============================================
// AMBI360 - Setup Database Script
// =============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔧 Iniciando configuração do banco de dados...');
        
        // Conectar ao MySQL (sem especificar database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            charset: 'utf8mb4'
        });

        console.log('✅ Conectado ao MySQL');

        // Criar database se não existir
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ambi360_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database '${process.env.DB_NAME || 'ambi360_db'}' criado/verificado`);

        // Conectar diretamente ao database
        await connection.end();
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ambi360_db',
            charset: 'utf8mb4'
        });

        console.log('🛠️ Conectado ao database, criando tabelas...');
        
        // Tabela users
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);

        // Tabela projects
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                main_image_url VARCHAR(500) NOT NULL,
                logo_url VARCHAR(500),
                password_hash VARCHAR(255),
                is_public BOOLEAN DEFAULT FALSE,
                unlock_order INT DEFAULT 0,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_unlock_order (unlock_order),
                INDEX idx_is_public (is_public)
            )
        `);

        // Tabela hotspots
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS hotspots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                parent_hotspot_id INT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                pitch DECIMAL(8,5) NOT NULL,
                yaw DECIMAL(8,5) NOT NULL,
                hotspot_type ENUM('normal', 'door', 'info', 'custom') DEFAULT 'normal',
                icon_type VARCHAR(50) DEFAULT 'normal_1',
                target_image_url VARCHAR(500),
                unlock_order INT DEFAULT 0,
                requires_previous BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_hotspot_id) REFERENCES hotspots(id) ON DELETE CASCADE,
                
                INDEX idx_project_id (project_id),
                INDEX idx_parent_hotspot (parent_hotspot_id),
                INDEX idx_unlock_order (unlock_order)
            )
        `);

        // Tabela user_progress
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_session VARCHAR(100) NOT NULL,
                project_id INT NOT NULL,
                hotspot_id INT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (hotspot_id) REFERENCES hotspots(id) ON DELETE CASCADE,
                
                UNIQUE KEY unique_progress (user_session, project_id, hotspot_id),
                INDEX idx_user_session (user_session),
                INDEX idx_project_progress (project_id, user_session)
            )
        `);

        // Tabela access_logs
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS access_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                user_session VARCHAR(100),
                ip_address VARCHAR(45),
                user_agent TEXT,
                accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                INDEX idx_project_access (project_id),
                INDEX idx_access_date (accessed_at)
            )
        `);

        // Tabela system_settings
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value TEXT,
                description VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Tabelas criadas/verificadas');

        // Verificar se usuário admin já existe
        const [adminUsers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
        
        if (adminUsers[0].count === 0) {
            // Criar usuário admin padrão
            const adminPassword = 'admin123';
            const passwordHash = await bcrypt.hash(adminPassword, 12);
            
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@ambi360.com', passwordHash, 'admin']
            );
            
            console.log('✅ Usuário admin criado');
            console.log('📧 Email: admin@ambi360.com');
            console.log('🔑 Senha: admin123');
            console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
        } else {
            console.log('ℹ️  Usuário admin já existe');
        }

        // Verificar se há projetos de exemplo
        const [projects] = await connection.execute('SELECT COUNT(*) as count FROM projects');
        
        if (projects[0].count === 0) {
            console.log('📝 Criando projeto de exemplo...');
            
            // Inserir projeto de exemplo
            const [projectResult] = await connection.execute(`
                INSERT INTO projects (name, title, description, main_image_url, is_public, unlock_order)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                'exemplo-tour',
                'Tour de Exemplo - AMBI360',
                'Este é um projeto de exemplo para demonstrar as funcionalidades da plataforma AMBI360.',
                'https://pannellum.org/images/alma.jpg',
                true,
                0
            ]);

            const projectId = projectResult.insertId;

            // Inserir hotspots de exemplo
            await connection.execute(`
                INSERT INTO hotspots (project_id, name, description, pitch, yaw, hotspot_type, icon_type, unlock_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                projectId,
                'Ponto Inicial',
                'Este é o ponto de partida do tour virtual',
                0,
                0,
                'normal',
                'normal_1',
                0
            ]);

            console.log('✅ Projeto de exemplo criado');
        }

        console.log('🎉 Configuração do banco de dados concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na configuração:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };