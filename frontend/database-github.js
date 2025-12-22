// GitHub como banco de dados
const GITHUB_TOKEN = 'COLE_SEU_TOKEN_AQUI'; // Token do GitHub
const GITHUB_REPO = 'SEU_USUARIO/ambi360-data'; // Seu repositório
const GITHUB_FILE = 'projects.json';

// Projetos padrão
const DEFAULT_PROJECTS = {
    'projeto-demo': {
        password: '123456',
        image: 'https://pannellum.org/images/alma.jpg',
        title: 'Projeto Demo',
        createdAt: new Date().toISOString(),
        hotspots: []
    },
    'casa-modelo': {
        password: 'casa2024',
        image: 'https://pannellum.org/images/cerro-toco-0.jpg',
        title: 'Casa Modelo',
        createdAt: new Date().toISOString(),
        hotspots: []
    }
};

async function loadProjects() {
    try {
        console.log('Carregando do GitHub...');
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            console.log('Projetos carregados do GitHub');
            return content;
        }
        
        throw new Error('Arquivo não encontrado');
    } catch (e) {
        console.warn('GitHub indisponível, usando localStorage:', e);
        const raw = localStorage.getItem('ambi360_projects');
        return raw ? JSON.parse(raw) : { ...DEFAULT_PROJECTS };
    }
}

async function saveProject(projectName, projectData) {
    try {
        const projects = await loadProjects();
        
        const { imageFile, logoFile, ...dataToSave } = projectData;
        dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
        
        if (projectData.imageFile) {
            dataToSave.image = 'https://pannellum.org/images/alma.jpg';
        }
        
        projects[projectName] = dataToSave;
        
        // Pegar SHA atual do arquivo
        let sha = '';
        try {
            const fileResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`
                }
            });
            
            if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.log('Arquivo não existe ainda, será criado');
        }
        
        // Salvar no GitHub
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Atualizar projeto: ${projectName}`,
                content: btoa(JSON.stringify(projects, null, 2)),
                sha: sha || undefined
            })
        });
        
        if (response.ok) {
            console.log('Projeto salvo no GitHub!');
            return true;
        }
        
        throw new Error('Erro ao salvar no GitHub');
        
    } catch (e) {
        console.warn('Erro no GitHub, usando localStorage:', e);
        // Fallback localStorage
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        const { imageFile, logoFile, ...dataToSave } = projectData;
        
        if (projectData.imageFile) {
            dataToSave.image = URL.createObjectURL(projectData.imageFile);
        }
        
        projects[projectName] = dataToSave;
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        return true;
    }
}

async function deleteProject(projectName) {
    try {
        const projects = await loadProjects();
        delete projects[projectName];
        
        // Pegar SHA atual
        const fileResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        
        const fileData = await fileResponse.json();
        
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Deletar projeto: ${projectName}`,
                content: btoa(JSON.stringify(projects, null, 2)),
                sha: fileData.sha
            })
        });
        
        return response.ok;
    } catch (e) {
        console.warn('Erro no GitHub:', e);
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        delete projects[projectName];
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        return true;
    }
}

async function uploadImage(file, path) {
    return URL.createObjectURL(file);
}