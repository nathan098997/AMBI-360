// AMBI360 - Versão 2.1 com Lixeira e IndexedDB + Sistema de Compartilhamento
const STORAGE_KEY = 'ambi360_projects';
const TRASH_KEY = 'ambi360_trash';
const DB_NAME = 'AMBI360_DB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

let db = null;
let trashedProjects = {};
let projects = {};
let viewer = null;
let previewViewer = null;
let hotspots = [];
let addingHotspot = false;
let currentParentId = null;
let previewCurrentImage = null;
let previewRootImage = null;
let editingProjectName = null;
let isAdminViewing = false;
let projectHotspots = [];
let currentProjectName = null;
let currentScene = 'main';
let currentHotspotId = null;
let currentViewState = { project: null, scene: null, point: null, pitch: 0, yaw: 0, fov: 75 };

// Inicializar IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Carregar projetos do IndexedDB
function loadProjects() {
    if (!db) {
        return Promise.resolve(loadProjectsFromLocalStorage());
    }
    
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(STORAGE_KEY);
        
        request.onsuccess = () => {
            if (request.result && request.result.projects) {
                resolve(request.result.projects);
            } else {
                resolve({});
            }
        };
        
        request.onerror = () => {
            resolve(loadProjectsFromLocalStorage());
        };
    });
}

function loadProjectsFromLocalStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
}

function loadTrashedProjects() {
    try {
        const stored = localStorage.getItem(TRASH_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
}

function saveTrashedProjects() {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trashedProjects));
}

function saveProjects() {
    if (!db) {
        return saveProjectsToLocalStorage();
    }
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const data = {
        id: STORAGE_KEY,
        projects: projects,
        timestamp: Date.now()
    };
    
    store.put(data);
}

function saveProjectsToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

document.addEventListener('DOMContentLoaded', function() {
    initDB().then(() => {
        return loadProjects();
    }).then(loadedProjects => {
        projects = loadedProjects;
        trashedProjects = loadTrashedProjects();
        setupEventListeners();
        loadTheme();
        checkUrlParams();
        initShareButton();
    }).catch(error => {
        projects = loadProjectsFromLocalStorage();
        trashedProjects = loadTrashedProjects();
        setupEventListeners();
        loadTheme();
        checkUrlParams();
        initShareButton();
    });
});

function setupEventListeners() {
    document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('addHotspotBtn').addEventListener('click', () => setAddHotspotMode(true));
    document.getElementById('removeHotspotBtn').addEventListener('click', removeAllHotspots);
    document.getElementById('createProjectForm').addEventListener('submit', handleCreateProject);
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Event listener para pesquisa
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    if (password === 'admin123') {
        showAdminPanel();
    } else {
        showError('Senha incorreta. Use: admin123');
    }
}

function showAdminPanel() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    updateProjectsGrid();
    showSection('projects');
}

function updateProjectsGrid(searchTerm = '') {
    const grid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');
    const sortOrder = document.getElementById('sortOrder')?.value || 'newest';
    grid.innerHTML = '';
    
    let projectEntries = Object.entries(projects);
    
    // Filtrar por termo de pesquisa
    if (searchTerm.trim()) {
        projectEntries = projectEntries.filter(([name, project]) => {
            const searchLower = searchTerm.toLowerCase();
            return name.toLowerCase().includes(searchLower) || 
                   project.title.toLowerCase().includes(searchLower);
        });
    }
    
    if (projectEntries.length === 0) {
        emptyState.classList.remove('hidden');
        if (searchTerm.trim()) {
            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <h3>Nenhum projeto encontrado</h3>
                <p>Nenhum projeto corresponde à pesquisa "${searchTerm}"</p>
            `;
        } else {
            emptyState.innerHTML = `
                <div class="empty-icon">📁</div>
                <h3>Nenhum projeto encontrado</h3>
                <p>Crie seu primeiro projeto usando o botão acima</p>
            `;
        }
        return;
    }
    
    // Ordenar projetos por data
    projectEntries.sort(([,a], [,b]) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
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

function handleCreateProject(e) {
    e.preventDefault();
    
    const name = document.getElementById('newProjectName').value.trim();
    const title = document.getElementById('newProjectTitle').value.trim();
    const imageFile = document.getElementById('imageUpload').files[0];
    const logoFile = document.getElementById('logoUpload').files[0];

    if (!name || !title) return showToast('Preencha todos os campos obrigatórios.', 'warning');
    if (!imageFile && !editingProjectName) return showToast('Selecione uma imagem 360°.', 'warning');

    const projectData = {
        title: title,
        hotspots: [...hotspots],
        createdAt: editingProjectName ? projects[editingProjectName].createdAt : new Date().toISOString(),
        image: editingProjectName ? projects[editingProjectName].image : null,
        logo: editingProjectName ? projects[editingProjectName].logo : null
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            projectData.image = e.target.result;
            processLogo(projectData, logoFile, name);
        };
        reader.readAsDataURL(imageFile);
    } else {
        processLogo(projectData, logoFile, name);
    }
}

function processLogo(projectData, logoFile, name) {
    if (logoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            projectData.logo = e.target.result;
            saveProject(projectData, name);
        };
        reader.readAsDataURL(logoFile);
    } else {
        saveProject(projectData, name);
    }
}

function saveProject(projectData, name) {
    if (editingProjectName && editingProjectName !== name) {
        delete projects[editingProjectName];
    }
    
    projects[name] = projectData;
    saveProjects();
    showToast(editingProjectName ? 'Projeto atualizado!' : 'Projeto criado!', 'success');
    editingProjectName = null;
    resetCreateForm();
    showSection('projects');
    updateProjectsGrid();
}

function previewProject(name) {
    isAdminViewing = true;
    showViewer(name);
}

function showViewer(projectName) {
    const project = projects[projectName];
    currentProjectName = projectName;
    
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('viewerContainer').classList.remove('hidden');
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('navProjectTitle').textContent = project.title;
    
    const projectLogo = document.getElementById('projectLogo');
    if (project.logo) {
        projectLogo.src = project.logo;
        projectLogo.style.display = 'block';
    } else {
        projectLogo.style.display = 'none';
    }
    
    projectHotspots = project.hotspots || [];
    initializeViewer(project);
}

function initializeViewer(project) {
    if (viewer) {
        viewer.destroy();
        viewer = null;
    }

    try {
        viewer = pannellum.viewer('panorama', {
            type: 'equirectangular',
            panorama: project.image,
            autoLoad: true,
            autoRotate: -2,
            compass: true,
            showZoomCtrl: true,
            showFullscreenCtrl: true,
            hotSpots: (project.hotspots || []).map(h => ({
                id: h.id,
                pitch: h.pitch,
                yaw: h.yaw,
                type: 'info',
                text: h.text,
                clickHandlerFunc: () => {
                    // INTEGRAÇÃO COM SISTEMA DE COMPARTILHAMENTO
                    currentHotspotId = h.id;
                    
                    // Se hotspot tem imagem de destino, navegar para nova cena
                    if (h.targetImage) {
                        currentScene = h.id;
                        openSceneFromUrl(h.id);
                    }
                    
                    // Atualizar URL sempre que cena ou ponto mudar
                    updateUrlState();
                }
            }))
        });
        
        // INTEGRAÇÃO COM SISTEMA DE COMPARTILHAMENTO
        // Atualizar URL quando visualização mudar
        viewer.on('load', () => {
            updateUrlState();
        });
        
        viewer.on('mouseup', () => {
            setTimeout(updateUrlState, 100);
        });
        
    } catch (e) {
        showToast('Não foi possível carregar o panorama.', 'danger');
    }
}

function editProject(name) {
    const project = projects[name];
    if (!project) return;
    
    editingProjectName = name;
    
    document.getElementById('newProjectName').value = name;
    document.getElementById('newProjectTitle').value = project.title;
    
    if (project.logo) {
        showExistingLogo(project.logo);
    }
    
    if (project.image) {
        showImagePreview(project.image);
        hotspots = project.hotspots ? [...project.hotspots] : [];
        setTimeout(() => updateHotspotsList(), 500);
    }
    
    document.getElementById('pageTitle').textContent = 'Editar Projeto';
    document.getElementById('pageSubtitle').textContent = 'Modifique as configurações do projeto.';
    document.getElementById('submitProjectBtn').textContent = 'Salvar Alterações';
    
    showSection('create');
}

function deleteProject(name) {
    if (confirm(`Mover projeto "${projects[name].title}" para a lixeira?`)) {
        trashedProjects[name] = {
            ...projects[name],
            deletedAt: new Date().toISOString()
        };
        
        delete projects[name];
        saveProjects();
        saveTrashedProjects();
        updateProjectsGrid();
        showToast('Projeto movido para a lixeira.', 'success');
    }
}

function updateTrashGrid() {
    const grid = document.getElementById('trashGrid');
    const emptyState = document.getElementById('emptyTrash');
    grid.innerHTML = '';
    
    const trashEntries = Object.entries(trashedProjects);
    
    if (trashEntries.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    trashEntries.forEach(([name, project]) => {
        const card = createTrashCard(name, project);
        grid.appendChild(card);
    });
}

function createTrashCard(name, project) {
    const deletedDate = new Date(project.deletedAt).toLocaleDateString('pt-BR');
    const hotspotCount = project.hotspots ? project.hotspots.length : 0;
    
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-thumbnail">
            <img src="${project.image}" alt="${project.title}">
            <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                🗑️ Excluído
            </div>
        </div>
        <div class="project-info">
            <div class="project-name">${project.title}</div>
            <div class="project-meta">Excluído em ${deletedDate} • ${hotspotCount} pontos</div>
            <div class="project-actions">
                <button class="btn-sm btn-view" onclick="restoreProject('${name}')">↩️ Restaurar</button>
                <button class="btn-sm btn-delete" onclick="permanentlyDeleteProject('${name}')">🗑️ Apagar Permanentemente</button>
            </div>
        </div>
    `;
    return card;
}

function restoreProject(name) {
    if (confirm(`Restaurar projeto "${trashedProjects[name].title}"?`)) {
        const project = { ...trashedProjects[name] };
        delete project.deletedAt;
        
        projects[name] = project;
        delete trashedProjects[name];
        
        saveProjects();
        saveTrashedProjects();
        updateTrashGrid();
        showToast('Projeto restaurado!', 'success');
    }
}

function permanentlyDeleteProject(name) {
    if (confirm(`ATENÇÃO: Apagar permanentemente "${trashedProjects[name].title}"?\n\nEsta ação NÃO pode ser desfeita!`)) {
        delete trashedProjects[name];
        saveTrashedProjects();
        updateTrashGrid();
        showToast('Projeto apagado permanentemente.', 'success');
    }
}

// Função de pesquisa
function handleSearch(e) {
    const searchTerm = e.target.value;
    updateProjectsGrid(searchTerm);
}

function showSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById('projectsSection').classList.add('hidden');
    document.getElementById('createSection').classList.add('hidden');
    document.getElementById('trashSection').classList.add('hidden');
    
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
    } else if (section === 'trash') {
        document.getElementById('trashSection').classList.remove('hidden');
        document.getElementById('pageTitle').textContent = 'Lixeira';
        document.getElementById('pageSubtitle').textContent = 'Projetos excluídos podem ser restaurados ou apagados permanentemente.';
        document.querySelectorAll('.nav-item')[2].classList.add('active');
        updateTrashGrid();
    }
}

function updateCreateSectionTitle() {
    if (!editingProjectName) {
        document.getElementById('pageTitle').textContent = 'Criar Projeto';
        document.getElementById('pageSubtitle').textContent = 'Configure um novo projeto 360°.';
        document.getElementById('submitProjectBtn').textContent = 'Criar Projeto';
    }
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
    }
}

function showImagePreview(imageSrc) {
    document.getElementById('imagePreview').classList.remove('hidden');
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

function setupHotspotClick() {
    const panoramaDiv = document.getElementById('previewPanorama');
    if (!panoramaDiv) return;
    
    panoramaDiv.addEventListener('click', function(e) {
        if (!addingHotspot) return;
        e.preventDefault();
        e.stopPropagation();
        
        let coords;
        try {
            coords = previewViewer.mouseEventToCoords(e);
        } catch (error) {
            coords = [previewViewer.getPitch(), previewViewer.getYaw()];
        }
        
        addHotspot(coords[0], coords[1]);
    });
}

function addHotspot(pitch, yaw) {
    const hotspot = {
        id: 'hotspot_' + Date.now(),
        pitch: pitch,
        yaw: yaw,
        text: 'Ponto ' + (hotspots.length + 1),
        targetImage: '',
        parentId: currentParentId,
        type: 'normal',
        typeImage: 'normal 1.png'
    };
    
    hotspots.push(hotspot);
    addHotspotToViewer(hotspot);
    updateHotspotsList();
    setAddHotspotMode(false);
    showToast('Ponto adicionado!', 'success');
}

function addHotspotToViewer(hotspot) {
    if (previewViewer) {
        previewViewer.addHotSpot({
            id: hotspot.id,
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type: 'info',
            text: hotspot.text
        });
    }
}

function updateHotspotsList() {
    const list = document.getElementById('hotspotsList');
    if (!list) return;
    
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

    currentList.forEach((hotspot, index) => {
        const item = document.createElement('div');
        item.className = 'hotspot-item';
        item.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px;">Ponto ${index + 1}</div>
            <input type="text" class="hotspot-input" placeholder="Nome do ponto" value="${hotspot.text}" onchange="updateHotspotText('${hotspot.id}', this.value)">
            <input type="file" accept="image/*" onchange="updateHotspotImage('${hotspot.id}', this)" style="width: 100%; margin-bottom: 8px;">
            <button onclick="${hotspot.targetImage ? `enterHotspot('${hotspot.id}')` : `testHotspot('${hotspot.id}')`}" style="width: 100%; margin-bottom: 8px;" class="btn-secondary">
                ${hotspot.targetImage ? '🔍 Entrar no Ponto' : 'Testar Posição'}
            </button>
            <button onclick="removeHotspot('${hotspot.id}')" style="width: 100%;" class="btn-danger">Remover</button>
        `;
        list.appendChild(item);
    });
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

function updateHotspotImage(id, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const hotspot = hotspots.find(h => h.id === id);
            if (hotspot) {
                hotspot.targetImage = e.target.result;
                updateHotspotsList();
                showToast('Imagem adicionada ao ponto!', 'success');
            }
        };
        reader.readAsDataURL(file);
    }
}

function enterHotspot(id) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot && hotspot.targetImage && previewViewer) {
        currentParentId = hotspot.id;
        previewCurrentImage = hotspot.targetImage;
        showImagePreview(previewCurrentImage);
        currentParentId = hotspot.id;
        updateHotspotsList();
        
        // INTEGRAÇÃO COM SISTEMA DE COMPARTILHAMENTO
        // Se estiver no viewer principal, atualizar estado
        if (viewer && currentProjectName) {
            currentScene = hotspot.id;
            updateUrlState();
        }
    }
}

function testHotspot(id) {
    const hotspot = hotspots.find(h => h.id === id);
    if (hotspot && previewViewer) {
        previewViewer.lookAt(hotspot.pitch, hotspot.yaw, 75, 1000);
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
            showImagePreview(previewCurrentImage);
        }
    } else {
        previewCurrentImage = previewRootImage;
        showImagePreview(previewCurrentImage);
    }
    updateHotspotsList();
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

function removeLogo() {
    document.getElementById('logoUpload').value = '';
    document.getElementById('logoPreview').classList.add('hidden');
    document.getElementById('logoUploadText').innerHTML = '🖼️ Clique para selecionar uma logo';
}

function resetCreateForm() {
    editingProjectName = null;
    document.getElementById('createProjectForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('logoPreview').classList.add('hidden');
    document.getElementById('logoUploadText').innerHTML = '🖼️ Clique para selecionar uma logo';
    hotspots = [];
    if (previewViewer) {
        previewViewer.destroy();
        previewViewer = null;
    }
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

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggleBtn').textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeToggleBtn').textContent = 'Modo Claro';
    }
}

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

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
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

// ===== SISTEMA DE COMPARTILHAMENTO ESTILO GOOGLE MAPS =====

// Verificar se está rodando em servidor HTTP/HTTPS
function isValidProtocol() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

// Inicializar botão de compartilhar
function initShareButton() {
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        // Sempre manter botão ativo
        shareBtn.disabled = false;
        shareBtn.textContent = '🔗 Compartilhar';
        shareBtn.title = 'Compartilhar visualização atual';
    }
}

// LEITURA DA URL AO CARREGAR - Verificar parâmetros no DOMContentLoaded
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectParam = urlParams.get('project');
    const sceneParam = urlParams.get('scene');
    const pointParam = urlParams.get('point');
    
    // Se não há parâmetros, carregar cena inicial normalmente
    if (!projectParam) return;
    
    // Verificar se projeto existe
    if (!projects[projectParam]) return;
    
    // Carregar projeto usando função real do sistema
    showViewer(projectParam);
    
    // Aguardar carregamento e aplicar estado específico
    setTimeout(() => {
        if (!viewer) return;
        
        // Se scene existir, chamar função real que abre a cena
        if (sceneParam) {
            openSceneFromUrl(sceneParam);
        }
        
        // Se point existir, chamar função real que abre o ponto dentro da cena
        if (pointParam) {
            openPointFromUrl(pointParam);
        }
    }, 1500);
}

// FUNÇÕES REAIS DO PROJETO - Abrir cena específica
function openSceneFromUrl(sceneId) {
    const hotspot = projectHotspots.find(h => h.id === sceneId && h.targetImage);
    if (hotspot) {
        currentScene = sceneId;
        currentParentId = sceneId;
        
        // Usar função real do projeto para carregar nova cena
        if (hotspot.targetImage) {
            viewer.destroy();
            viewer = pannellum.viewer('panorama', {
                type: 'equirectangular',
                panorama: hotspot.targetImage,
                autoLoad: true,
                autoRotate: -2,
                compass: true,
                showZoomCtrl: true,
                showFullscreenCtrl: true,
                hotSpots: projectHotspots.filter(h => h.parentId === sceneId).map(h => ({
                    id: h.id,
                    pitch: h.pitch,
                    yaw: h.yaw,
                    type: 'info',
                    text: h.text,
                    clickHandlerFunc: () => {
                        currentHotspotId = h.id;
                        updateUrlState();
                    }
                }))
            });
            
            viewer.on('load', updateUrlState);
            viewer.on('mouseup', () => setTimeout(updateUrlState, 100));
        }
    }
}

// FUNÇÕES REAIS DO PROJETO - Abrir ponto específico
function openPointFromUrl(pointId) {
    const hotspot = projectHotspots.find(h => h.id === pointId);
    if (hotspot && viewer) {
        currentHotspotId = pointId;
        // Usar função real do projeto para navegar ao ponto
        viewer.lookAt(hotspot.pitch, hotspot.yaw, 75, 1000);
        updateUrlState();
    }
}

// ATUALIZAÇÃO DA URL - Sempre que cena ou ponto mudar
function updateUrlState() {
    if (!viewer || !currentProjectName) return;
    
    try {
        const params = new URLSearchParams();
        params.set('project', currentProjectName);
        
        // Estado mínimo esperado: ?scene=<id>&point=<id>
        if (currentScene && currentScene !== 'main') {
            params.set('scene', currentScene);
        }
        
        if (currentHotspotId) {
            params.set('point', currentHotspotId);
        }
        
        // Usar exclusivamente window.location.origin + pathname
        const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        
        // Usar history.replaceState conforme especificado
        history.replaceState({}, "", newUrl);
    } catch (e) {
        // Fallback seguro - ignorar erros
    }
}

// BOTÃO COMPARTILHAR - Gerar link público universal
function shareCurrentView() {
    // Gerar link público que funciona em qualquer lugar
    const publicUrl = generateUniversalShareLink();
    copyToClipboard(publicUrl);
    showShareFeedback();
}

// CONFIGURAÇÃO DE URL PÚBLICA - Configure aqui a URL do seu site
const PUBLIC_SITE_CONFIG = {
    // SUBSTITUA pela URL pública do seu GitHub Pages
    baseUrl: 'https://SEU-USUARIO.github.io/AMBI-360',
    
    // URLs alternativas para diferentes ambientes
    production: 'https://seu-site.com',
    github: 'https://SEU-USUARIO.github.io/AMBI-360',
    netlify: 'https://seu-site.netlify.app',
    vercel: 'https://seu-site.vercel.app'
};

// Detectar URL pública automaticamente ou usar configurada
function getPublicBaseUrl() {
    const currentHost = window.location.hostname;
    
    // Se está em produção (não localhost), usar URL atual
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && !currentHost.startsWith('192.168')) {
        return `${window.location.protocol}//${window.location.host}${window.location.pathname.replace('/index.html', '')}`;
    }
    
    // Se está em desenvolvimento local, usar URL configurada
    return PUBLIC_SITE_CONFIG.baseUrl;
}

// Gerar link universal que funciona em qualquer PC/celular
function generateUniversalShareLink() {
    if (!currentProjectName) {
        return getPublicBaseUrl();
    }
    
    const params = new URLSearchParams();
    params.set('project', currentProjectName);
    
    if (currentScene && currentScene !== 'main') {
        params.set('scene', currentScene);
    }
    
    if (currentHotspotId) {
        params.set('point', currentHotspotId);
    }
    
    const publicBaseUrl = getPublicBaseUrl();
    return `${publicBaseUrl}/?${params.toString()}`;
}

// Copiar para área de transferência
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback para copiar texto
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Erro ao copiar:', err);
    }
    
    document.body.removeChild(textArea);
}

// Mostrar feedback visual ("Link público copiado")
function showShareFeedback() {
    const shareBtn = document.getElementById('shareBtn');
    if (!shareBtn) return;
    
    const originalText = shareBtn.innerHTML;
    shareBtn.innerHTML = '✓ Link público copiado';
    shareBtn.style.backgroundColor = '#10b981';
    
    setTimeout(() => {
        shareBtn.innerHTML = originalText;
        shareBtn.style.backgroundColor = '';
    }, 3000);
    
    showToast('Link público copiado! Funciona em qualquer dispositivo.', 'success');
}