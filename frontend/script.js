// Configuração e dados
const STORAGE_KEY = 'ambi360_projects';
const ADMIN_PASSWORD = 'admin123';

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

// Estado da aplicação
let projects = loadProjects();
let viewer = null;
let previewViewer = null;
let hotspots = [];
let addingHotspot = false;
let currentParentId = null;
let previewCurrentImage = null;
let previewRootImage = null;
let editingProjectName = null;
let isAdminViewing = false;
let currentScene = 'main';
let projectHotspots = [];

// Funções de persistência
function loadProjects() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { ...DEFAULT_PROJECTS };
    } catch (e) {
        console.warn('Erro ao carregar projetos:', e);
        return { ...DEFAULT_PROJECTS };
    }
}

function saveProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Erro ao salvar projetos:', e);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadTheme();
}

function setupEventListeners() {
    // Login admin
    document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);

    // Upload de arquivos
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

    // Controles de hotspot
    document.getElementById('addHotspotBtn').addEventListener('click', () => setAddHotspotMode(true));
    document.getElementById('removeHotspotBtn').addEventListener('click', removeAllHotspots);

    // Criar projeto
    document.getElementById('createProjectForm').addEventListener('submit', handleCreateProject);

    // Logout
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('logoPreview');
        const uploadText = document.getElementById('logoUploadText');
        
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Logo preview">
            <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">Logo selecionada: ${file.name}</div>
            <button type="button" class="btn-danger" style="margin-top: 8px; padding: 4px 8px; font-size: 12px;" onclick="removeLogo()">Remover Logo</button>
        `;
        preview.classList.remove('hidden');
        uploadText.innerHTML = '✅ Logo selecionada';
    };
    reader.readAsDataURL(file);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        hideImagePreview();
    }
}

function handleCreateProject(e) {
    e.preventDefault();
    
    const nameRaw = document.getElementById('newProjectName').value.trim();
    const name = slugify(nameRaw);
    const title = document.getElementById('newProjectTitle').value.trim();
    const imageFile = document.getElementById('imageUpload').files[0];
    const logoFile = document.getElementById('logoUpload').files[0];

    // Validações
    if (!name) return showToast('Informe um nome de projeto.', 'warning');
    if (!title) return showToast('Informe um título.', 'warning');
    if (!imageFile && !editingProjectName) return showToast('Selecione uma imagem 360°.', 'warning');
    if (projects[name] && !editingProjectName) return showToast('Projeto já existe!', 'danger');

    // Processar criação/edição sem senha
    if (editingProjectName && !imageFile) {
        updateExistingProject(name, '', title, logoFile);
    } else {
        createNewProject(name, '', title, imageFile, logoFile);
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        hideError();
        showAdminPanel();
    } else {
        showError('Senha de admin incorreta!');
    }
}

function showAdminPanel() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    showSection('projects');
    updateProjectsGrid();
}

function showViewer(projectName) {
    const project = projects[projectName];
    
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('viewerContainer').classList.remove('hidden');
    document.getElementById('projectTitle').textContent = project.title;
    
    // Logo personalizada
    const projectLogo = document.getElementById('projectLogo');
    if (project.logo) {
        projectLogo.src = project.logo;
        projectLogo.style.display = 'block';
    } else {
        projectLogo.style.display = 'none';
    }
    
    projectHotspots = project.hotspots || [];
    currentScene = 'main';
    
    initializeViewer(project);
}

function initializeViewer(project) {
    if (viewer) {
        viewer.destroy();
        viewer = null;
    }

    try {
        if (projectHotspots.length > 0) {
            const scenes = createScenesConfig(project.image, projectHotspots);
            viewer = pannellum.viewer('panorama', {
                default: {
                    firstScene: 'main',
                    autoLoad: true,
                    autoRotate: -2,
                    compass: true,
                    showZoomCtrl: true,
                    showFullscreenCtrl: true
                },
                scenes: scenes
            });
            
            viewer.on('scenechange', handleSceneChange);
        } else {
            viewer = pannellum.viewer('panorama', {
                type: 'equirectangular',
                panorama: project.image,
                autoLoad: true,
                autoRotate: -2,
                compass: true,
                showZoomCtrl: true,
                showFullscreenCtrl: true
            });
        }
        
        viewer.on('load', updateNavigation);
        
    } catch (e) {
        console.error('Erro ao iniciar viewer:', e);
        showToast('Não foi possível carregar o panorama.', 'danger');
    }
}

function handleSceneChange(sceneId) {
    currentScene = sceneId;
    updateNavigation();
}

function createScenesConfig(mainImage, hotspotsArray) {
    const scenes = { 
        main: { 
            type: 'equirectangular', 
            panorama: mainImage, 
            hotSpots: [] 
        } 
    };
    
    // CORREÇÃO: Filtrar APENAS pontos ROOT (parentId = null) para cena principal
    const rootHotspots = (hotspotsArray || []).filter(h => h.parentId === null || h.parentId === undefined);
    
    // Na cena principal, mostrar apenas pontos ROOT
    rootHotspots.forEach(hotspot => {
        if (hotspot.targetImage) {
            scenes.main.hotSpots.push({
                id: hotspot.id,
                pitch: hotspot.pitch,
                yaw: hotspot.yaw,
                type: 'scene',
                text: hotspot.text,
                sceneId: 'scene_' + hotspot.id,
                cssClass: getHotspotClass(hotspot.type, hotspot.typeImage)
            });
        }
    });
    
    // Criar cenas para TODOS os hotspots (não apenas ROOT)
    const allHotspots = (hotspotsArray || []);
    allHotspots.forEach((hotspot) => {
        if (hotspot.targetImage) {
            const sceneId = 'scene_' + hotspot.id;
            const hotSpots = [];
            
            // Botão voltar - vai para o pai ou main se for ROOT
            const parentScene = hotspot.parentId ? 'scene_' + hotspot.parentId : 'main';
            hotSpots.push({
                id: `back_${sceneId}`,
                pitch: -10,
                yaw: 180,
                type: 'scene',
                text: 'Voltar',
                sceneId: parentScene,
                cssClass: 'hotspot-back'
            });
            
            // CORREÇÃO: Mostrar APENAS filhos diretos deste hotspot
            const childHotspots = allHotspots.filter(child => child.parentId === hotspot.id);
            childHotspots.forEach(child => {
                if (child.targetImage) {
                    hotSpots.push({
                        id: child.id,
                        pitch: child.pitch,
                        yaw: child.yaw,
                        type: 'scene',
                        text: child.text,
                        sceneId: 'scene_' + child.id,
                        cssClass: getHotspotClass(child.type, child.typeImage)
                    });
                }
            });
            
            scenes[sceneId] = {
                type: 'equirectangular',
                panorama: hotspot.targetImage,
                hotSpots: hotSpots
            };
        }
    });
    
    return scenes;
}

function getHotspotClass(type, typeImage) {
    if (type === 'door') {
        if (typeImage === 'porta 2.png') {
            return 'hotspot-door porta-2';
        }
        return 'hotspot-door porta-1';
    } else {
        if (typeImage === 'normal 2.png') {
            return 'hotspot-nav normal-2';
        }
        return 'hotspot-nav normal-1';
    }
}

function updateNavigation() {
    const navRooms = document.getElementById('navRooms');
    if (!navRooms) return;
    
    navRooms.innerHTML = '';
    
    // Cena principal
    const mainBtn = createNavButton('Cena Principal', currentScene === 'main', () => {
        if (viewer && currentScene !== 'main') {
            viewer.loadScene('main');
        }
    });
    navRooms.appendChild(mainBtn);
    
    // Hotspots disponíveis
    const mainHotspots = projectHotspots.filter(h => !h.parentId && h.targetImage);
    
    if (currentScene === 'main' && mainHotspots.length > 0) {
        const hotspot = mainHotspots[0];
        const btn = createNavButton(hotspot.text, false, () => {
            if (viewer) viewer.loadScene('scene_' + hotspot.id);
        }, 'next-available');
        navRooms.appendChild(btn);
    } else {
        const currentIndex = mainHotspots.findIndex(h => 'scene_' + h.id === currentScene);
        
        mainHotspots.forEach((hotspot, index) => {
            const sceneId = 'scene_' + hotspot.id;
            const isCurrentScene = currentScene === sceneId;
            const shouldShow = index <= currentIndex + 1;
            
            if (shouldShow) {
                const btn = createNavButton(
                    hotspot.text, 
                    isCurrentScene, 
                    () => {
                        if (viewer && currentScene !== sceneId) {
                            viewer.loadScene(sceneId);
                        }
                    },
                    index === currentIndex + 1 ? 'next-available' : ''
                );
                navRooms.appendChild(btn);
            }
        });
    }
}

function createNavButton(text, isActive, onClick, extraClass = '') {
    const btn = document.createElement('button');
    btn.className = `nav-room ${isActive ? 'active' : ''} ${extraClass}`;
    btn.textContent = text;
    btn.onclick = onClick;
    return btn;
}

// Funções de seção
function showSection(section) {
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Esconder todas as seções
    document.getElementById('projectsSection').classList.add('hidden');
    document.getElementById('createSection').classList.add('hidden');
    
    if (section === 'projects') {
        document.getElementById('projectsSection').classList.remove('hidden');
        document.getElementById('pageTitle').textContent = 'Projetos';
        document.getElementById('pageSubtitle').textContent = 'Aqui você faz a gestão de seus projetos.';
        document.querySelectorAll('.nav-item')[0].classList.add('active');
        resetCreateForm();
    } else if (section === 'create') {
        document.getElementById('createSection').classList.remove('hidden');
        updateCreateSectionTitle();
        document.querySelectorAll('.nav-item')[1].classList.add('active');
    }
}

function updateCreateSectionTitle() {
    if (!editingProjectName) {
        document.getElementById('pageTitle').textContent = 'Criar Projeto';
        document.getElementById('pageSubtitle').textContent = 'Configure um novo projeto 360°.';
        document.getElementById('submitProjectBtn').textContent = 'Criar Projeto';
    }
}

// Funções de projeto
function updateProjectsGrid() {
    const grid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');
    grid.innerHTML = '';
    
    const projectEntries = Object.entries(projects);
    
    if (projectEntries.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    projectEntries.forEach(([name, project]) => {
        const card = createProjectCard(name, project);
        grid.appendChild(card);
    });
}

function createProjectCard(name, project) {
    const createdDate = new Date(project.createdAt).toLocaleDateString('pt-BR');
    const hotspotCount = project.hotspots ? project.hotspots.length : 0;
    
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-thumbnail">
            <img src="${project.image}" alt="${project.title}">
        </div>
        <div class="project-info">
            <div class="project-name">${project.title}</div>
            <div class="project-meta">Tour Virtual 360° • ${createdDate} • ${hotspotCount} pontos</div>
            <div class="project-actions">
                <button class="btn-sm btn-view" onclick="previewProject('${name}')">👁️ Ver</button>
                <button class="btn-sm btn-edit" onclick="editProject('${name}')">✏️ Editar</button>
                <button class="btn-sm btn-delete" onclick="deleteProject('${name}')">🗑️ Excluir</button>
            </div>
        </div>
    `;
    return card;
}

function editProject(name) {
    const project = projects[name];
    if (!project) return;
    
    editingProjectName = name;
    
    // Preencher formulário
    document.getElementById('newProjectName').value = name;
    document.getElementById('newProjectTitle').value = project.title;
    
    // Logo existente
    if (project.logo) {
        showExistingLogo(project.logo);
    }
    
    // Imagem existente
    if (project.image) {
        showImagePreview(project.image);
        hotspots = project.hotspots ? [...project.hotspots] : [];
        setTimeout(() => updateHotspotsList(), 1000);
    }
    
    // Atualizar títulos
    document.getElementById('pageTitle').textContent = 'Editar Projeto';
    document.getElementById('pageSubtitle').textContent = 'Modifique as configurações do projeto.';
    document.getElementById('submitProjectBtn').textContent = 'Salvar Alterações';
    
    showSection('create');
}

function showExistingLogo(logoSrc) {
    const preview = document.getElementById('logoPreview');
    const uploadText = document.getElementById('logoUploadText');
    
    preview.innerHTML = `
        <img src="${logoSrc}" alt="Logo preview">
        <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">Logo atual do projeto</div>
        <button type="button" class="btn-danger" style="margin-top: 8px; padding: 4px 8px; font-size: 12px;" onclick="removeLogo()">Remover Logo</button>
    `;
    preview.classList.remove('hidden');
    uploadText.innerHTML = '✅ Logo carregada';
}

function previewProject(name) {
    isAdminViewing = true;
    showViewer(name);
}

function deleteProject(name) {
    if (confirm(`Excluir projeto "${projects[name].title}"?`)) {
        delete projects[name];
        saveProjects();
        updateProjectsGrid();
        showToast('Projeto excluído.', 'success');
    }
}

function createNewProject(name, password, title, imageFile, logoFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const projectData = {
            password: '', // Sem senha
            image: e.target.result,
            title: title,
            hotspots: [...hotspots],
            createdAt: editingProjectName ? projects[editingProjectName].createdAt : new Date().toISOString()
        };
        
        if (logoFile) {
            const logoReader = new FileReader();
            logoReader.onload = function(logoEvent) {
                projectData.logo = logoEvent.target.result;
                saveProject(name, projectData);
            };
            logoReader.readAsDataURL(logoFile);
        } else {
            projectData.logo = null;
            saveProject(name, projectData);
        }
    };
    reader.readAsDataURL(imageFile);
}

function updateExistingProject(name, password, title, logoFile) {
    const existingProject = projects[editingProjectName];
    if (!existingProject) return;
    
    // Remover projeto antigo se nome mudou
    if (editingProjectName !== name) {
        delete projects[editingProjectName];
    }
    
    const projectData = {
        password: '', // Sem senha
        image: existingProject.image,
        title: title,
        hotspots: [...hotspots],
        logo: existingProject.logo || null,
        createdAt: existingProject.createdAt
    };
    
    if (logoFile) {
        const logoReader = new FileReader();
        logoReader.onload = function(e) {
            projectData.logo = e.target.result;
            saveProject(name, projectData);
        };
        logoReader.readAsDataURL(logoFile);
    } else {
        saveProject(name, projectData);
    }
}

function saveProject(name, projectData) {
    projects[name] = projectData;
    saveProjects();
    
    const message = editingProjectName ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!';
    showToast(message, 'success');
    resetCreateForm();
    showSection('projects');
    updateProjectsGrid();
}

// Funções de preview de imagem
function showImagePreview(imageSrc) {
    document.getElementById('imagePreview').classList.remove('hidden');
    // INICIALIZAR: currentParentId = null significa ROOT (ponto principal inicial)
    currentParentId = null;
    previewCurrentImage = imageSrc;
    previewRootImage = imageSrc;

    if (previewViewer) {
        previewViewer.destroy();
    }

    setTimeout(() => {
        previewViewer = pannellum.viewer('previewPanorama', {
            type: 'equirectangular',
            panorama: previewCurrentImage,
            autoLoad: true,
            showZoomCtrl: false,
            showFullscreenCtrl: false
        });
        
        previewViewer.on('load', function() {
            setupHotspotClick();
            updateHotspotsList();
        });
    }, 100);
}

function hideImagePreview() {
    document.getElementById('imagePreview').classList.add('hidden');
    if (previewViewer) {
        previewViewer.destroy();
        previewViewer = null;
    }
    hotspots = [];
    addingHotspot = false;
}

function setupHotspotClick() {
    const panoramaDiv = document.getElementById('previewPanorama');
    if (!panoramaDiv) return;
    
    const onClickPreview = (event) => {
        if (!addingHotspot) return;
        event.preventDefault();
        event.stopPropagation();
        
        let coords = null;
        try { 
            coords = previewViewer.mouseEventToCoords(event); 
        } catch (_) {}
        
        const pitch = coords ? coords[0] : previewViewer.getPitch();
        const yaw = coords ? coords[1] : previewViewer.getYaw();
        
        addHotspot(pitch, yaw);
    };
    
    panoramaDiv.addEventListener('click', onClickPreview, true);
}

function addHotspot(pitch, yaw) {
    const hotspotId = 'hotspot_' + Date.now();
    
    const hotspot = {
        id: hotspotId,
        pitch: pitch,
        yaw: yaw,
        text: 'Ponto ' + (hotspots.length + 1),
        targetImage: '',
        parentId: currentParentId, // USAR PONTO PRINCIPAL ATIVO ATUAL
        type: 'normal',
        typeImage: 'normal 1.png' // Imagem padrão para novos hotspots
    };
    
    hotspots.push(hotspot);
    addHotspotToViewer(hotspot);
    updateHotspotsList();
    setAddHotspotMode(false);
    showToast('Ponto adicionado!', 'success');
}

function addHotspotToViewer(hotspot) {
    if (previewViewer) {
        const hotspotConfig = {
            id: hotspot.id,
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type: 'info',
            text: hotspot.text,
            cssClass: getHotspotClass(hotspot.type, hotspot.typeImage)
        };
        
        previewViewer.addHotSpot(hotspotConfig);
    }
}

// Funções de hotspot
function updateHotspotsList() {
    const list = document.getElementById('hotspotsList');
    list.innerHTML = '';

    const currentList = hotspots.filter(h => (h.parentId || null) === (currentParentId || null));

    if (currentParentId) {
        const backBtn = document.createElement('button');
        backBtn.textContent = '↩ Voltar';
        backBtn.className = 'btn-secondary';
        backBtn.style.marginBottom = '8px';
        backBtn.onclick = goBackToParent;
        list.appendChild(backBtn);
    }

    if (currentList.length === 0) {
        const p = document.createElement('p');
        p.style.color = '#6b7280';
        p.style.fontStyle = 'italic';
        p.textContent = 'Nenhum ponto adicionado nesta cena';
        list.appendChild(p);
        return;
    }

    currentList.forEach((hotspot, index) => {
        const item = createHotspotItem(hotspot, index);
        list.appendChild(item);
    });
}

function createHotspotItem(hotspot, index) {
    const item = document.createElement('div');
    item.className = 'hotspot-item';
    
    const hotspotType = hotspot.type || 'normal';
    
    item.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">Ponto ${index + 1}</div>
        <input type="text" class="hotspot-input" placeholder="Nome do ponto" value="${hotspot.text}" onchange="updateHotspotText('${hotspot.id}', this.value)">
        
        <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px;">Tipo do Ponto:</div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-secondary ${hotspotType === 'normal' ? 'btn-primary' : ''}" onclick="changeHotspotType('${hotspot.id}', 'normal')" style="flex: 1; padding: 8px;">Normal</button>
                <button type="button" class="btn-secondary ${hotspotType === 'door' ? 'btn-primary' : ''}" onclick="changeHotspotType('${hotspot.id}', 'door')" style="flex: 1; padding: 8px;">Porta</button>
            </div>
        </div>
        
        <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px;">Ajustar Posição:</div>
            <div class="hotspot-grid">
                <div></div>
                <button class="hotspot-btn" onclick="moveHotspot('${hotspot.id}', 0, 5)">↑</button>
                <div></div>
                <button class="hotspot-btn" onclick="moveHotspot('${hotspot.id}', -5, 0)">←</button>
                <button class="hotspot-btn center" onclick="centerHotspot('${hotspot.id}')">Centro</button>
                <button class="hotspot-btn" onclick="moveHotspot('${hotspot.id}', 5, 0)">→</button>
                <div></div>
                <button class="hotspot-btn" onclick="moveHotspot('${hotspot.id}', 0, -5)">↓</button>
                <div></div>
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 6px; text-align: center;">Pitch: ${hotspot.pitch.toFixed(1)}° | Yaw: ${hotspot.yaw.toFixed(1)}°</div>
        </div>
        
        <input type="file" accept="image/*" onchange="updateHotspotImage('${hotspot.id}', this)" style="width: 100%; margin-bottom: 8px;">
        <small style="color: #6b7280; display: block; margin-bottom: 8px;">Selecione a imagem 360° para este ponto</small>
        
        <button class="${hotspot.targetImage ? 'btn-primary' : 'btn-secondary'}" onclick="${hotspot.targetImage ? `enterHotspot('${hotspot.id}')` : `testHotspot('${hotspot.id}')`}" style="width: 100%; margin-bottom: 8px;">
            ${hotspot.targetImage ? '🔍 Entrar no Ponto' : 'Testar Posição'}
        </button>
        
        <button class="btn-danger" onclick="removeHotspot('${hotspot.id}')" style="width: 100%;">Remover</button>
    `;
    
    return item;
}

function updateHotspotText(id, text) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot) {
        hotspot.text = text;
        if (previewViewer) {
            previewViewer.removeHotSpot(id);
            addHotspotToViewer(hotspot);
        }
    }
}

function changeHotspotType(id, type) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot) {
        hotspot.type = type;
        
        // Alternar imagem baseada no tipo e imagem atual
        if (type === 'door') {
            // Para porta, alternar entre porta 1.png e porta 2.png
            if (hotspot.typeImage === 'porta 1.png') {
                hotspot.typeImage = 'porta 2.png';
            } else {
                hotspot.typeImage = 'porta 1.png';
            }
        } else {
            // Para normal, alternar entre normal 1.png e normal 2.png
            if (hotspot.typeImage === 'normal 1.png') {
                hotspot.typeImage = 'normal 2.png';
            } else {
                hotspot.typeImage = 'normal 1.png';
            }
        }
        
        if (previewViewer) {
            previewViewer.removeHotSpot(id);
            addHotspotToViewer(hotspot);
        }
        
        updateHotspotsList();
        const imageName = hotspot.typeImage.replace('.png', '').replace(' ', ' ');
        showToast(`Tipo alterado para ${type === 'door' ? 'Porta' : 'Normal'} (${imageName})!`, 'success');
    }
}

function moveHotspot(id, deltaYaw, deltaPitch) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot && previewViewer) {
        hotspot.yaw = ((hotspot.yaw + deltaYaw) % 360 + 360) % 360;
        hotspot.pitch = Math.max(-90, Math.min(90, hotspot.pitch + deltaPitch));
        previewViewer.removeHotSpot(id);
        addHotspotToViewer(hotspot);
        updateHotspotsList();
    }
}

function centerHotspot(id) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot && previewViewer) {
        hotspot.pitch = previewViewer.getPitch();
        hotspot.yaw = previewViewer.getYaw();
        previewViewer.removeHotSpot(id);
        addHotspotToViewer(hotspot);
        updateHotspotsList();
    }
}

function updateHotspotImage(id, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const hotspot = hotspots.find(h => h.id === id);
            if (hotspot) {
                hotspot.targetImage = e.target.result;
                updateHotspotsList();
                showToast('Cena conectada! Você pode entrar e adicionar pontos dentro dela.', 'success');
            }
        };
        reader.readAsDataURL(file);
    }
}

function enterHotspot(id) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot && hotspot.targetImage && previewViewer) {
        // MUDAR PONTO PRINCIPAL ATIVO: currentParentId = hotspot.id
        currentParentId = hotspot.id;
        previewCurrentImage = hotspot.targetImage;
        showImagePreview(previewCurrentImage);
        // Após showImagePreview, restaurar o currentParentId correto
        currentParentId = hotspot.id;
        updateHotspotsList();
    }
}

function testHotspot(id) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot && previewViewer) {
        previewViewer.lookAt(hotspot.pitch, hotspot.yaw, 75, 1000);
    }
}

function removeHotspot(id) {
    hotspots = hotspots.filter(h => h.id !== id);
    if (previewViewer) {
        previewViewer.removeHotSpot(id);
    }
    updateHotspotsList();
}

function removeAllHotspots() {
    hotspots = [];
    updateHotspotsList();
    if (previewViewer) {
        previewViewer.removeAllHotSpots();
    }
}

function goBackToParent() {
    const parentHotspot = hotspots.find(h => h.id === currentParentId);
    const grandParentId = parentHotspot ? (parentHotspot.parentId || null) : null;
    currentParentId = grandParentId;
    
    if (grandParentId) {
        const gpHotspot = hotspots.find(h => h.id === grandParentId);
        if (gpHotspot && gpHotspot.targetImage) {
            previewCurrentImage = gpHotspot.targetImage;
            previewViewer.setPanorama(previewCurrentImage);
        }
    } else {
        previewCurrentImage = previewRootImage;
        showImagePreview(previewCurrentImage);
    }
    updateHotspotsList();
}

// Funções utilitárias
function setAddHotspotMode(on) {
    const btn = document.getElementById('addHotspotBtn');
    addingHotspot = !!on;
    if (btn) {
        if (on) {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
            btn.textContent = 'Clique na imagem';
        } else {
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
            btn.textContent = 'Adicionar Ponto';
        }
    }
}

function removeLogo() {
    document.getElementById('logoUpload').value = '';
    document.getElementById('logoPreview').classList.add('hidden');
    document.getElementById('logoUploadText').innerHTML = '🖼️ Clique para selecionar uma logo';
}

function resetCreateForm() {
    editingProjectName = null;
    document.getElementById('createProjectForm').reset();
    hideImagePreview();
    removeLogo();
    hotspots = [];
    updateCreateSectionTitle();
}

function slugify(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function showToast(message, type = 'success') {
    // Usar o div de erro como toast temporário
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return alert(message);
    
    errorDiv.textContent = message;
    errorDiv.className = `error ${type}`;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
        errorDiv.className = 'error';
    }, 3000);
}

// Funções de controle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function showHelpModal() {
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelpModal() {
    document.getElementById('helpModal').classList.add('hidden');
}

function toggleNavigation() {
    if (isAdminViewing) {
        if (viewer) {
            viewer.destroy();
            viewer = null;
        }
        document.getElementById('viewerContainer').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        isAdminViewing = false;
    } else {
        logout();
    }
}

function logout() {
    if (viewer) {
        viewer.destroy();
        viewer = null;
    }
    
    if (previewViewer) {
        previewViewer.destroy();
        previewViewer = null;
    }
    
    document.getElementById('viewerContainer').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('adminForm').reset();
    hideError();
    resetCreateForm();
    isAdminViewing = false;
}

// Modo escuro
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
    
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        const isDark = document.body.classList.contains('dark');
        btn.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
    }
}