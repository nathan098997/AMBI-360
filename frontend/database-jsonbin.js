// JSONBin.io - Armazenamento JSON gratuito online
const JSONBIN_API_KEY = '$2a$10$YOUR_API_KEY'; // Você vai pegar no site
const JSONBIN_BIN_ID = 'YOUR_BIN_ID'; // Será criado automaticamente

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
        console.log('Carregando projetos do JSONBin...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Projetos carregados:', data.record);
            return data.record || DEFAULT_PROJECTS;
        }
        
        throw new Error('Erro ao carregar');
    } catch (e) {
        console.warn('JSONBin indisponível, usando localStorage:', e);
        const raw = localStorage.getItem('ambi360_projects');
        return raw ? JSON.parse(raw) : { ...DEFAULT_PROJECTS };
    }
}

async function saveProject(projectName, projectData) {
    try {
        // Usar URLs das imagens
        if (projectData.imageFile) {
            projectData.image = 'https://pannellum.org/images/alma.jpg'; // Placeholder
        }
        
        if (projectData.logoFile) {
            projectData.logo = null;
        }
        
        const { imageFile, logoFile, ...dataToSave } = projectData;
        dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
        
        // Carregar projetos atuais
        const projects = await loadProjects();
        projects[projectName] = dataToSave;
        
        console.log('Salvando no JSONBin:', projectName);
        
        // Salvar no JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(projects)
        });
        
        if (response.ok) {
            console.log('Projeto salvo no JSONBin com sucesso!');
            return true;
        }
        
        throw new Error('Erro ao salvar no JSONBin');
        
    } catch (e) {
        console.warn('Erro no JSONBin, usando localStorage:', e);
        
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
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(projects)
        });
        
        return response.ok;
    } catch (e) {
        console.warn('Erro no JSONBin, usando localStorage:', e);
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        delete projects[projectName];
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        return true;
    }
}

async function uploadImage(file, path) {
    return URL.createObjectURL(file);
}

// Inicializar JSONBin (criar bin se não existir)
async function initializeJSONBin() {
    if (JSONBIN_BIN_ID === 'YOUR_BIN_ID') {
        console.log('Configure o JSONBin primeiro!');
        console.log('1. Acesse https://jsonbin.io');
        console.log('2. Crie conta gratuita');
        console.log('3. Crie um novo bin');
        console.log('4. Copie a API Key e Bin ID');
    }
}