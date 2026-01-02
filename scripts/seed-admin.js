// =============================================
// AMBI360 - Seed Admin User (Simples)
// =============================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdmin() {
    let connection;
    
    try {
        console.log('🔧 Conectando ao MySQL...');
        
        // Conectar ao MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ambi360_db'
        });

        console.log('✅ Conectado ao banco');

        // Usar raw query (sem prepared statement) para verificar admin
        const [result] = await connection.query(
            'SELECT COUNT(*) as count FROM users WHERE username = ?',
            ['admin']
        );
        
        if (result[0].count === 0) {
            const adminPassword = 'admin123';
            const passwordHash = await bcrypt.hash(adminPassword, 12);
            
            await connection.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@ambi360.com', passwordHash, 'admin']
            );
            
            console.log('✅ Usuário admin criado com sucesso');
            console.log('📧 Email: admin@ambi360.com');
            console.log('🔑 Senha: admin123');
            console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
        } else {
            console.log('ℹ️  Usuário admin já existe no banco');
        }
        
        console.log('🎉 Seed concluído!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    seedAdmin();
}

module.exports = { seedAdmin };
