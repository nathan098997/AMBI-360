// ===== BACKUP AUTOMÁTICO GITHUB =====
// Adicione este arquivo à sua versão que funciona

// Configuração - SUBSTITUA pelos seus dados
const GITHUB_TOKEN = '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';
const GITHUB_REPO = 'nathan098997/ambi360-data';

// Função de backup
async function backupToGitHub() {
    if (GITHUB_TOKEN === 'COLE_SEU_TOKEN_AQUI') {
        console.log('⚠️ Configure o GitHub primeiro!');
        return;
    }
    
    try {
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        
        // Pegar SHA atual (se arquivo existe)
        let sha = '';
        try {
            const fileResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/projects.json`, {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
            });
            if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {}
        
        // Salvar no GitHub
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/projects.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Backup automático AMBI360 - ' + new Date().toLocaleString(),
                content: btoa(JSON.stringify(projects, null, 2)),
                sha: sha || undefined
            })
        });
        
        if (response.ok) {
            console.log('✅ Backup salvo no GitHub!');
        } else {
            console.warn('❌ Erro no backup GitHub:', response.status);
        }
    } catch (e) {
        console.warn('❌ Erro no backup GitHub:', e.message);
    }
}

// Interceptar função saveProjects quando ela existir
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(() => {
        if (typeof saveProjects === 'function') {
            const originalSaveProjects = saveProjects;
            window.saveProjects = function() {
                originalSaveProjects();
                backupToGitHub();
            };
            console.log('✅ Backup automático ativado!');
        } else {
            console.warn('⚠️ Função saveProjects não encontrada');
        }
    }, 1000);
});