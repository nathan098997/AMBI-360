// =============================================
// AMBI360 - Configuração do Banco de Dados
// =============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração da conexão usando variáveis de ambiente
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ambi360_db',
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Pool de conexões para melhor performance
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Função para testar conexão
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado ao banco de dados MySQL');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com o banco de dados:', error.message);
        return false;
    }
}

// Função para executar queries
async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Erro na query:', error.message);
        throw error;
    }
}

// Função para transações
async function executeTransaction(queries) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params || []);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Função para fechar pool de conexões
async function closePool() {
    try {
        await pool.end();
        console.log('Pool de conexões fechado');
    } catch (error) {
        console.error('Erro ao fechar pool:', error.message);
    }
}

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction,
    closePool
};