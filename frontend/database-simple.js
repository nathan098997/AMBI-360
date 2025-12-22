// Configuração do Supabase
const SUPABASE_URL = 'https://cbijpytcumsgmpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaWpweXRjdW1zZ21weiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM2NjI4MDAwLCJleHAiOjIwNTIyMDQwMDB9.PLACEHOLDER';

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
            return {};
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
            
            let response = await fetch(`${this.url}/rest/v1/projects`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(projectData)
            });
            
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
            return false;
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
            return false;
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
        // Tentar carregar do Supabase primeiro
        const projects = await supabase.getProjects();
        if (Object.keys(projects).length > 0) {
            return projects;
        }
    } catch (e) {
        console.warn('Supabase indisponível, usando localStorage:', e);
    }
    
    // Fallback para localStorage
    try {
        const raw = localStorage.getItem('ambi360_projects');
        return raw ? JSON.parse(raw) : { ...DEFAULT_PROJECTS };
    } catch (e) {
        return { ...DEFAULT_PROJECTS };
    }
}

async function saveProject(projectName, projectData) {
    try {
        // Converter imagens para base64
        if (projectData.imageFile) {
            const imageUrl = await convertToBase64(projectData.imageFile);
            if (imageUrl) projectData.image = imageUrl;
        }
        
        if (projectData.logoFile) {
            const logoUrl = await convertToBase64(projectData.logoFile);
            if (logoUrl) projectData.logo = logoUrl;
        }
        
        const { imageFile, logoFile, ...dataToSave } = projectData;
        dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
        
        // Tentar salvar no Supabase primeiro
        try {
            const success = await supabase.saveProject(projectName, dataToSave);
            if (success) {
                console.log('Projeto salvo no Supabase');
                return true;
            }
        } catch (e) {
            console.warn('Supabase indisponível, salvando localmente:', e);
        }
        
        // Fallback para localStorage
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        projects[projectName] = dataToSave;
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        console.log('Projeto salvo no localStorage');
        return true;
        
    } catch (e) {
        console.error('Erro ao salvar projeto:', e);
        return false;
    }
}

function convertToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

async function uploadImage(file, path) {
    return await convertToBase64(file);
}

async function deleteProject(projectName) {
    try {
        // Tentar deletar do Supabase primeiro
        try {
            const success = await supabase.deleteProject(projectName);
            if (success) {
                console.log('Projeto deletado do Supabase');
                return true;
            }
        } catch (e) {
            console.warn('Supabase indisponível, deletando localmente:', e);
        }
        
        // Fallback para localStorage
        const projects = JSON.parse(localStorage.getItem('ambi360_projects') || '{}');
        delete projects[projectName];
        localStorage.setItem('ambi360_projects', JSON.stringify(projects));
        console.log('Projeto deletado do localStorage');
        return true;
        
    } catch (e) {
        console.error('Erro ao deletar:', e);
        return false;
    }
}