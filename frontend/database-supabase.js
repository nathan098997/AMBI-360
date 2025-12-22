// Configuração do Supabase
const SUPABASE_URL = 'https://cfbjijxyrtciumsgnpzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_S2m8iF2oN31NLlHVFf_oSA_P0iKoZb4';

// Cliente Supabase simples
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    async getProjects() {
        try {
            const response = await fetch(`${this.url}/rest/v1/projects?select=*`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const projects = {};
            data.forEach(project => {
                projects[project.name] = {
                    password: project.password,
                    title: project.title,
                    image: project.image,
                    logo: project.logo,
                    hotspots: project.hotspots || [],
                    createdAt: project.created_at
                };
            });
            
            return projects;
        } catch (e) {
            console.error('Erro ao buscar projetos:', e);
            throw e;
        }
    }

    async saveProject(name, project) {
        try {
            const projectData = {
                name: name,
                password: project.password || '',
                title: project.title,
                image: project.image,
                logo: project.logo || null,
                hotspots: project.hotspots || [],
                created_at: project.createdAt || new Date().toISOString()
            };
            
            // Tentar inserir primeiro
            let response = await fetch(`${this.url}/rest/v1/projects`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(projectData)
            });
            
            // Se falhar (projeto já existe), fazer update
            if (!response.ok) {
                response = await fetch(`${this.url}/rest/v1/projects?name=eq.${name}`, {
                    method: 'PATCH',
                    headers: this.headers,
                    body: JSON.stringify(projectData)
                });
            }
            
            return response.ok;
        } catch (e) {
            console.error('Erro ao salvar projeto:', e);
            throw e;
        }
    }

    async deleteProject(name) {
        try {
            const response = await fetch(`${this.url}/rest/v1/projects?name=eq.${name}`, {
                method: 'DELETE',
                headers: this.headers
            });
            return response.ok;
        } catch (e) {
            console.error('Erro ao deletar projeto:', e);
            throw e;
        }
    }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        console.log('Tentando carregar do Supabase...');
        const projects = await supabase.getProjects();
        console.log('Projetos carregados do Supabase:', projects);
        return Object.keys(projects).length > 0 ? projects : { ...DEFAULT_PROJECTS };
    } catch (e) {
        console.warn('Supabase indisponível, usando localStorage:', e);
        const raw = localStorage.getItem('ambi360_projects');
        return raw ? JSON.parse(raw) : { ...DEFAULT_PROJECTS };
    }
}

async function saveProject(projectName, projectData) {
    try {
        // Usar URLs das imagens em vez de base64
        if (projectData.imageFile) {
            // Para Supabase, usar URL externa ou placeholder
            projectData.image = 'https://pannellum.org/images/alma.jpg'; // Placeholder
        }
        
        if (projectData.logoFile) {
            projectData.logo = null; // Por enquanto sem logo
        }
        
        const { imageFile, logoFile, ...dataToSave } = projectData;
        dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
        
        console.log('Tentando salvar no Supabase:', projectName, dataToSave);
        const success = await supabase.saveProject(projectName, dataToSave);
        
        if (success) {
            console.log('Projeto salvo no Supabase com sucesso!');
            return true;
        }
        
        throw new Error('Falha ao salvar no Supabase');
        
    } catch (e) {
        console.warn('Erro ao salvar no Supabase, usando localStorage:', e);
        
        // Fallback para localStorage
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        const { imageFile, logoFile, ...dataToSave } = projectData;
        
        if (projectData.imageFile) {
            dataToSave.image = URL.createObjectURL(projectData.imageFile);
        }
        if (projectData.logoFile) {
            dataToSave.logo = URL.createObjectURL(projectData.logoFile);
        }
        
        projects[projectName] = dataToSave;
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        return true;
    }
}

async function deleteProject(projectName) {
    try {
        const success = await supabase.deleteProject(projectName);
        if (success) {
            console.log('Projeto deletado do Supabase');
            return true;
        }
        throw new Error('Falha ao deletar do Supabase');
    } catch (e) {
        console.warn('Erro ao deletar do Supabase, usando localStorage:', e);
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        delete projects[projectName];
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        return true;
    }
}

async function uploadImage(file, path) {
    return URL.createObjectURL(file);
}