const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAdmin() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ambi360_db'
        });

        console.log('✅ Conectado ao banco');

        // Verificar usuário admin
        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        
        if (users.length === 0) {
            console.log('❌ Usuário admin não encontrado');
            
            // Criar usuário admin
            const passwordHash = await bcrypt.hash('admin123', 12);
            await connection.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@ambi360.com', passwordHash, 'admin']
            );
            console.log('✅ Usuário admin criado');
        } else {
            const user = users[0];
            console.log('✅ Usuário admin encontrado:', {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
            
            // Testar senha
            const isValid = await bcrypt.compare('admin123', user.password_hash);
            console.log('🔑 Senha admin123 válida:', isValid);
            
            if (!isValid) {
                // Resetar senha
                const newHash = await bcrypt.hash('admin123', 12);
                await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
                console.log('🔄 Senha resetada para admin123');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAdmin();