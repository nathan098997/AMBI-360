// =============================================
// AMBI360 - Script de Inicialização Rápida
// =============================================

const { setupDatabase } = require('./setup-database');
const fs = require('fs');
const path = require('path');

async function quickStart() {
    console.log('🚀 AMBI360 - Inicialização Rápida\n');

    try {
        // 1. Verificar se .env existe
        const envPath = path.join(__dirname, '../.env');
        if (!fs.existsSync(envPath)) {
            console.log('📝 Criando arquivo .env...');
            const envExample = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');
            fs.writeFileSync(envPath, envExample);
            console.log('✅ Arquivo .env criado');
            console.log('⚠️  Configure suas credenciais no arquivo .env antes de continuar\n');
        }

        // 2. Criar diretórios necessários
        console.log('📁 Criando diretórios...');
        const directories = [
            '../uploads',
            '../uploads/panoramas',
            '../uploads/logos',
            '../uploads/general'
        ];

        directories.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`  ✅ ${dir}`);
            }
        });

        // 3. Configurar banco de dados
        console.log('\n🗄️  Configurando banco de dados...');
        await setupDatabase();

        // 4. Instruções finais
        console.log('\n🎉 Inicialização concluída com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('  1. Configure o arquivo .env com suas credenciais');
        console.log('  2. Execute: npm start');
        console.log('  3. Acesse: http://localhost:3001');
        console.log('\n🔑 Credenciais padrão:');
        console.log('  Email: admin@ambi360.com');
        console.log('  Senha: admin123');
        console.log('\n📚 Documentação da API: API_DOCUMENTATION.md');

    } catch (error) {
        console.error('❌ Erro na inicialização:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    quickStart();
}

module.exports = { quickStart };