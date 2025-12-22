// Versão local simples - sem Supabase, sem imagens base64

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

// Funções globais
async function loadProjects() {
    try {
        const raw = localStorage.getItem('ambi360_projects');
        return raw ? JSON.parse(raw) : { ...DEFAULT_PROJECTS };
    } catch (e) {
        return { ...DEFAULT_PROJECTS };
    }
}

async function saveProject(projectName, projectData) {
    try {
        // Usar URLs das imagens em vez de base64
        if (projectData.imageFile) {
            projectData.image = URL.createObjectURL(projectData.imageFile);
        }
        
        if (projectData.logoFile) {
            projectData.logo = URL.createObjectURL(projectData.logoFile);
        }
        
        const { imageFile, logoFile, ...dataToSave } = projectData;
        dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
        
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        projects[projectName] = dataToSave;
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        
        console.log('Projeto salvo localmente');
        return true;
        
    } catch (e) {
        console.error('Erro ao salvar projeto:', e);
        return false;
    }
}

async function deleteProject(projectName) {
    try {
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        delete projects[projectName];
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        return true;
    } catch (e) {
        console.error('Erro ao deletar:', e);
        return false;
    }
}

async function uploadImage(file, path) {
    return URL.createObjectURL(file);
}