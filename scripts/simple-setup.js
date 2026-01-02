// =============================================
// AMBI360 - Setup Simples
// =============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function simpleSetup() {
    let connection;
    
    try {
        console.log('🔧 Configuração simples do AMBI360...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ambi360_db',
            charset: 'utf8mb4'
        });

        console.log('✅ Conectado ao banco ambi360_db');

        // Criar usuário admin
        const adminPassword = 'admin123';
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        
        try {
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@ambi360.com', passwordHash, 'admin']
            );
            console.log('✅ Usuário admin criado');
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('ℹ️  Usuário admin já existe');
            } else {
                throw error;
            }
        }

        // Criar projeto exemplo
        try {
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
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('ℹ️  Projeto exemplo já existe');
            } else {
                console.log('⚠️  Erro ao criar projeto exemplo:', error.message);
            }
        }

        console.log('\n🎉 Setup concluído!');
        console.log('\n🔑 Credenciais:');
        console.log('  Email: admin@ambi360.com');
        console.log('  Senha: admin123');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

simpleSetup();