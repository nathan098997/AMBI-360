# AMBI360 - Documentação da API

## Visão Geral

A API do AMBI360 fornece endpoints para gerenciar tours virtuais 360°, hotspots, usuários e progresso de navegação.

**Base URL:** `http://localhost:3001/api`

## Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu_jwt_token>
```

## Endpoints

### 🔐 Autenticação (`/api/auth`)

#### POST `/api/auth/login`
Fazer login no sistema.

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ambi360.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/register`
Registrar novo usuário.

**Body:**
```json
{
  "username": "novouser",
  "email": "user@example.com",
  "password": "senha123",
  "role": "user"
}
```

### 🏢 Projetos (`/api/projects`)

#### GET `/api/projects`
Listar projetos públicos.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "exemplo-tour",
      "title": "Tour de Exemplo",
      "description": "Descrição do tour",
      "main_image_url": "https://example.com/image.jpg",
      "logo_url": null,
      "unlock_order": 0,
      "total_hotspots": 5,
      "door_hotspots": 2
    }
  ]
}
```

#### GET `/api/projects/:id`
Buscar projeto por ID.

**Query Parameters:**
- `sessionId` (opcional): ID da sessão do usuário

#### POST `/api/projects` 🔒 Admin
Criar novo projeto.

**Body:**
```json
{
  "name": "meu-tour",
  "title": "Meu Tour Virtual",
  "description": "Descrição do meu tour",
  "main_image_url": "https://example.com/panorama.jpg",
  "logo_url": "https://example.com/logo.png",
  "password": "senha_opcional",
  "is_public": true,
  "unlock_order": 1
}
```

#### PUT `/api/projects/:id` 🔒 Admin
Atualizar projeto.

#### DELETE `/api/projects/:id` 🔒 Admin
Deletar projeto (soft delete).

### 📍 Hotspots (`/api/hotspots`)

#### GET `/api/hotspots/project/:projectId`
Buscar hotspots de um projeto.

#### POST `/api/hotspots` 🔒 Admin
Criar hotspot.

**Body:**
```json
{
  "project_id": 1,
  "parent_hotspot_id": null,
  "name": "Entrada Principal",
  "description": "Ponto de entrada do tour",
  "pitch": 0,
  "yaw": 180,
  "hotspot_type": "door",
  "icon_type": "porta_1",
  "target_image_url": "https://example.com/next-scene.jpg",
  "unlock_order": 0,
  "requires_previous": false
}
```

#### PUT `/api/hotspots/:id` 🔒 Admin
Atualizar hotspot.

#### DELETE `/api/hotspots/:id` 🔒 Admin
Deletar hotspot.

### 📊 Progresso (`/api/progress`)

#### POST `/api/progress/unlock`
Desbloquear hotspot (sistema Google Maps).

**Body:**
```json
{
  "projectId": 1,
  "hotspotId": 5,
  "sessionId": "user_session_123"
}
```

#### GET `/api/progress/:projectId/:sessionId`
Buscar progresso do usuário.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "progress": [
      {
        "hotspot_id": 1,
        "name": "Entrada",
        "unlock_order": 0,
        "is_unlocked": true,
        "unlocked_at": "2024-01-15T10:30:00Z"
      }
    ],
    "stats": {
      "total": 10,
      "unlocked": 3,
      "percentage": 30
    }
  }
}
```

#### DELETE `/api/progress/:projectId/:sessionId`
Resetar progresso do usuário.

### 👨‍💼 Admin (`/api/admin`) 🔒 Admin

#### GET `/api/admin/dashboard`
Estatísticas do dashboard.

#### GET `/api/admin/projects`
Listar todos os projetos (incluindo privados).

#### GET `/api/admin/users`
Listar usuários.

#### PUT `/api/admin/users/:userId/password`
Alterar senha de usuário.

**Body:**
```json
{
  "newPassword": "nova_senha_123"
}
```

#### PUT `/api/admin/users/:userId/status`
Ativar/desativar usuário.

**Body:**
```json
{
  "isActive": false
}
```

#### GET `/api/admin/logs`
Logs de acesso.

**Query Parameters:**
- `limit`: Número de registros (padrão: 50)
- `offset`: Offset para paginação (padrão: 0)
- `projectId`: Filtrar por projeto

### 📁 Upload (`/api/upload`) 🔒 Admin

#### POST `/api/upload/panorama`
Upload de imagem panorâmica 360°.

**Form Data:**
- `panorama`: Arquivo de imagem (JPEG, PNG, WebP)

#### POST `/api/upload/logo`
Upload de logo.

**Form Data:**
- `logo`: Arquivo de imagem (JPEG, PNG, WebP, SVG)

#### POST `/api/upload/multiple`
Upload múltiplo de arquivos.

**Form Data:**
- `files`: Array de arquivos (máximo 5)

#### DELETE `/api/upload/:folder/:filename`
Deletar arquivo enviado.

### 🏥 Health Check

#### GET `/api/health`
Verificar status da API e banco de dados.

**Resposta:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `409` - Conflito (já existe)
- `500` - Erro interno do servidor

## Tipos de Hotspot

- `normal` - Hotspot padrão
- `door` - Porta/passagem
- `info` - Informativo
- `custom` - Personalizado

## Tipos de Ícone

- `normal_1`, `normal_2` - Ícones normais
- `porta_1`, `porta_2` - Ícones de porta

## Exemplo de Uso

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Buscar projetos
const projectsResponse = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const projects = await projectsResponse.json();
```

## Notas Importantes

- 🔒 Rotas marcadas requerem autenticação
- Admin: Requer role de administrador
- Todos os timestamps estão em UTC
- Arquivos de upload são servidos em `/uploads/`
- Tamanho máximo de arquivo: 10MB (configurável)
- Sessões de usuário são identificadas por `sessionId` único