# 📋 Análise Completa do Projeto AMBI360

**Data:** 22 de dezembro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Servidor rodando em `http://localhost:3001`

---

## 📊 Resumo Executivo

O projeto **AMBI360** é uma plataforma de tours virtuais 360° com gestão de projetos e hotspots interativos. A análise cobriu:

- ✅ **38 arquivos inventariados**
- ✅ **7 dependências críticas** (Express, MySQL2, JWT, bcrypt, Multer, etc.)
- ✅ **Backend completo:** servidor, rotas, controllers, middlewares, config
- ✅ **Frontend funcional:** HTML5, CSS, JavaScript (IndexedDB + Pannellum.js)
- ✅ **Login implementado** (agora via API backend com JWT)
- ✅ **Banco de dados:** MySQL com estrutura de projetos, hotspots, usuários e logs

---

## 🔍 Problemas Identificados e Corrigidos

### **CRÍTICOS** (Corrigidos ✅)

#### 1. **Autenticação Insegura no Frontend**
- **Problema:** Senha admin (`admin123`) estava hardcoded em `frontend/script.js`
- **Risco:** Contorno trivial da autenticação (verificação client-side)
- **Solução Aplicada:** Migrada para autenticação via API backend com JWT
  - Frontend agora faz POST `/api/auth/login` com credenciais
  - Servidor retorna JWT que é armazenado em `localStorage`
  - Tokens são validados server-side em cada requisição protegida
- **Arquivo:** [frontend/script.js](frontend/script.js#L138-L170)

#### 2. **Parsing Incorreto de MAX_FILE_SIZE**
- **Problema:** `parseInt(process.env.MAX_FILE_SIZE)` interpretava `"10MB"` como `10` bytes
- **Risco:** Limite de upload não funcionava; possível DoS por upload de arquivos grandes
- **Solução Aplicada:** Adicionada função `parseSize()` que interpreta:
  - Strings: `"10MB"`, `"5M"`, `"10KB"`, `"1GB"`, etc.
  - Números puros: `10485760` (bytes)
- **Arquivo:** [backend/config/app.config.js](backend/config/app.config.js#L45-L68)

#### 3. **Secrets Hardcoded em Código**
- **Problema:** `JWT_SECRET`, `SESSION_SECRET` tinham fallbacks inseguros em produção
  - `'ambi360-jwt-secret-2024'`  
  - `'ambi360-secret-key-2024'`
- **Risco:** Tokens previsíveis; comprometimento de segurança em produção
- **Solução Aplicada:** 
  - Middleware e controllers agora usam centralizadamente `config.security.*`
  - Fallbacks removidos em produção (obrigatorio via `.env`)
  - Variável de environment validada no `validateConfig()`
- **Arquivos:** [backend/middleware/auth.middleware.js](backend/middleware/auth.middleware.js), [backend/controllers/auth.controller.js](backend/controllers/auth.controller.js), [backend/controllers/admin.controller.js](backend/controllers/admin.controller.js)

#### 4. **Bcrypt Rounds Hardcoded**
- **Problema:** Valor `12` estava hardcoded em 3+ arquivos
- **Risco:** Difícil manutenção; inconsistência se alterado
- **Solução Aplicada:** Centralizado em `config.security.bcryptRounds`
- **Arquivos:** [backend/controllers/*.js](backend/controllers/)

#### 5. **Servidor Escutando Apenas em IPv6**
- **Problema:** Express listen sem host específico → bind to `[::1]` (IPv6 loopback)
- **Risco:** Cliente IPv4 não consegue acessar server localmente
- **Solução Aplicada:** Explicitado `app.listen(PORT, '0.0.0.0', ...)` para ouvir em todas as interfaces
- **Arquivo:** [backend/server.js](backend/server.js#L73-L87)

---

### **ALTOS** (Identificados, Não Corrigidos)

#### 6. **CORS Permissivo em Desenvolvimento**
- **Problema:** `origin: '*'` permite requests de qualquer origem
- **Risco:** Roubo de tokens JWT em navegador; CSRF em produção
- **Recomendação:** 
  ```javascript
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
  ```
- **Status:** Configurável via `.env` (feito: `CORS_ORIGIN` agora em `.env`)

#### 7. **Sem Rate Limiting ou Proteção contra Força Bruta**
- **Problema:** Endpoint `/api/auth/login` sem limites de tentativas
- **Risco:** Ataque de força bruta contra credenciais admin
- **Recomendação:** Adicionar `express-rate-limit`:
  ```javascript
  npm install express-rate-limit
  // Aplicar middleware em rotas sensíveis
  const rateLimit = require('express-rate-limit');
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
  router.post('/login', loginLimiter, login);
  ```

#### 8. **Sem HTTPS em Produção**
- **Problema:** Cookies/tokens trafegam em plain HTTP
- **Risco:** Interceptação (MITM attack)
- **Recomendação:** Usar `HTTPS` + `secure: true` em cookies em produção

#### 9. **Uploads Servidos Publicamente Sem Validação Extra**
- **Problema:** Arquivos em `/uploads` são servidos como static files
- **Risco:** 
  - SVG uploads podem executar scripts (XSS)
  - Sem Content-Type headers adequados
- **Recomendação:** 
  - Renomear arquivos + gerar IDs únicos (já feito: nomes aleatórios com timestamp)
  - Configurar headers Content-Type corretos
  - Considerar servir uploads via `/api/download/:id` com type-checking

#### 10. **Sem Helmet (Headers de Segurança)**
- **Problema:** Faltam headers de segurança (X-Frame-Options, X-Content-Type-Options, etc.)
- **Risco:** Vulnerabilidades de segurança do navegador (clickjacking, MIME sniffing)
- **Recomendação:**
  ```javascript
  npm install helmet
  const helmet = require('helmet');
  app.use(helmet());
  ```

---

### **MÉDIOS** (Identificados, Informativo)

#### 11. **Dados de Usuário em IndexedDB (Client-Side)**
- **Problema:** Frontend armazena imagens como data-URLs em IndexedDB
- **Impacto:** Blobs grandes podem causar lag; limite de storage (50MB-1GB)
- **Recomendação:** 
  - Enviar imagens ao servidor; guardar apenas URLs
  - Exemplo: `/api/upload/panorama` → retorna URL, salva em DB

#### 12. **Sem Validação de MIME Type Extensão**
- **Problema:** Multer valida por `mimetype`, mas usuário pode contornar
- **Recomendação:**
  ```javascript
  const path = require('path');
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
    return cb(new Error('Extensão não permitida'), false);
  }
  ```

#### 13. **Logs Não Persistem (Console Only)**
- **Problema:** Logs apenas em stdout; perdidos ao reiniciar
- **Recomendação:** Adicionar log file rotation (winston ou pino)

#### 14. **Variáveis de Config do MySQL2 Inválidas**
- **Problema:** `acquireTimeout`, `timeout`, `reconnect` não são opções válidas
- **Aviso:** Aparece em cada inicialização
- **Solução:** Remover do `backend/config/db.js`:
  ```javascript
  // ❌ Remover:
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
  
  // ✅ Usar (se preciso):
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  ```

---

## ✅ Funcionalidades Implementadas

| Feature | Status | Nota |
|---------|--------|------|
| **Login Admin** | ✅ Backend | Credenciais: `admin` / `admin123` (via API) |
| **CRUD Projetos** | ✅ | GET `/api/projects`, POST/PUT/DELETE protegidos |
| **CRUD Hotspots** | ✅ | GET `/api/hotspots/project/:id`, criar/editar/deletar |
| **Upload Imagens** | ✅ | Panoramas + logos; size limit configurável |
| **Tours Virtuais 360°** | ✅ | Via Pannellum.js; multi-cena com hotspots |
| **Rastreamento de Progresso** | ✅ | `user_progress` table; session-based |
| **Admin Dashboard** | ⚠️ Frontend Only | Precisa conectar ao backend |
| **Database Seeding** | ✅ | Script `seed-admin.js` cria usuário padrão |

---

## 🚀 Como Iniciar Localmente

### Pré-requisitos
- **Node.js** v14+
- **MySQL** rodando em `localhost:3306`

### Passos
1. **Instalar dependências:**
   ```powershell
   npm install
   ```

2. **Configurar `.env`** (já criado):
   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=q1w2e3
   DB_NAME=ambi360_db
   APP_PORT=3001
   JWT_SECRET=seu-secret-jwt-aqui
   ```

3. **Criar banco + usuário admin:**
   ```powershell
   node scripts/seed-admin.js
   ```

4. **Iniciar servidor:**
   ```powershell
   npm run dev
   # ou
   node backend/server.js
   ```

5. **Acessar:**
   - Frontend: `http://localhost:3001`
   - API: `http://localhost:3001/api`
   - Login: email `admin@ambi360.com` / senha `admin123`

---

## 🔐 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| **Username** | `admin` |
| **Email** | `admin@ambi360.com` |
| **Senha** | `admin123` |
| **⚠️ Ação** | **Altere após 1º login!** |

---

## 📁 Estrutura do Projeto

```
AMBI-360/
├── backend/
│   ├── server.js                 # Entry point (escuta 0.0.0.0:3001)
│   ├── config/
│   │   ├── app.config.js        # Configuração centralizada + parseSize()
│   │   ├── db.js                # Pool MySQL
│   │   └── upload.js            # Multer + file handling
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification (corrigido)
│   │   └── validation.middleware.js
│   ├── controllers/
│   │   ├── auth.controller.js   # Login/Register (usa config centralizado)
│   │   ├── projects.controller.js
│   │   ├── hotspots.controller.js
│   │   ├── admin.controller.js
│   │   ├── progress.controller.js
│   │   └── upload.controller.js
│   └── routes/
│       ├── auth.routes.js
│       ├── projects.routes.js
│       ├── hotspots.routes.js
│       ├── progress.routes.js
│       ├── admin.routes.js
│       └── upload.routes.js
├── frontend/
│   ├── index.html               # Login + Admin Panel + Viewer
│   ├── script.js                # Login via API (corrigido)
│   ├── style.css
│   └── hotspots.css
├── scripts/
│   ├── seed-admin.js            # ✅ Cria admin (novo)
│   ├── setup-database.js        # Setup DB
│   └── quick-start.js           # Auto-setup
├── database.sql                 # Schema SQL
├── package.json                 # Dependências
├── .env                         # Configurações (corrigido)
├── .env.example                 # Template
└── README.md
```

---

## 📝 Correções Aplicadas - Resumo

| # | Arquivo | Mudança | Tipo |
|----|---------|---------|------|
| 1 | `app.config.js` | Adicionada `parseSize()` para converter MAX_FILE_SIZE | 🔒 Segurança |
| 2 | `upload.js` | Usar `config.upload.*` em vez de env direto | 🔒 Segurança |
| 3 | `auth.middleware.js` | Usar `config.security.jwtSecret` centralizado | 🔒 Segurança |
| 4 | `auth.controller.js` | Usar `config.security` para bcrypt + JWT | 🔒 Segurança |
| 5 | `projects.controller.js` | Usar `config.security.bcryptRounds` | 🔒 Segurança |
| 6 | `admin.controller.js` | Usar `config.security.bcryptRounds` | 🔒 Segurança |
| 7 | `script.js` | Remover `ADMIN_PASSWORD` hardcoded; login via API | 🔒 Crítico |
| 8 | `server.js` | Adicionar bind a `'0.0.0.0'` (não apenas IPv6) | 🔒 Bug |
| 9 | `app.config.js` | `parseInt(APP_PORT)` para ler env corretamente | 🔧 Bug |
| 10 | `scripts/seed-admin.js` | **Arquivo novo:** Seed simples de admin | ✅ Novo |
| 11 | `.env` | Atualizada: PORT 3001, MAX_FILE_SIZE em bytes | ✅ Config |

---

## 🎯 Recomendações para Produção

### **Imediatas** (antes de deploy)
1. ✅ **Alterar todos os secrets** em `.env`:
   ```ini
   JWT_SECRET=seu-jwt-super-secreto-aleatorio-64-chars
   SESSION_SECRET=outro-secret-aleatorio-64-chars
   DB_PASSWORD=senha-forte-mysql
   ```

2. ✅ **Configurar HTTPS** (SSL/TLS):
   - Usar `nginx` reverse proxy ou `certbot` + Let's Encrypt
   - Ativar `secure: true` em cookies

3. ✅ **Adicionar rate limiting**:
   ```bash
   npm install express-rate-limit
   ```

4. ✅ **Adicionar Helmet**:
   ```bash
   npm install helmet
   app.use(require('helmet')());
   ```

5. ✅ **Auditar vulnerabilidades:**
   ```bash
   npm audit
   npm audit fix
   ```

### **Desejáveis**
- Usar `.env.production` para variáveis sensíveis
- Implementar logging persistente (Winston/Pino)
- Adicionar monitoramento (PM2, New Relic, Datadog)
- Implementar backup automático do banco de dados
- Usar CDN para uploads (AWS S3, Cloudflare, etc.)
- Implementar cache (Redis) para sessões

---

## 🧪 Teste de Login

**Endpoint:** `POST http://localhost:3001/api/auth/login`

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Resposta esperada:**
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

---

## 📊 Métricas de Segurança

| Aspecto | Score | Status |
|--------|-------|--------|
| Autenticação | ✅ 8/10 | JWT implementado; sem rate limiting |
| Criptografia | ✅ 9/10 | Bcrypt 12 rounds; secrets centralizados |
| Validação | ✅ 7/10 | Middleware presente; poderia ser mais rigoroso |
| CORS | ⚠️ 5/10 | Aberto em dev; melhorar em prod |
| Headers | ❌ 3/10 | Sem Helmet; adicionar ASAP |
| **GERAL** | **⚠️ 6.5/10** | **Bom para dev; fortalecer antes de prod** |

---

## 📞 Suporte & Próximas Etapas

### Issues Conhecidas
- MySQL2 warnings sobre `acquireTimeout` (remover da config)
- Frontend precisa se conectar ao backend para gerenciar projetos
- Sem banco de dados de exemplo carregado (use `scripts/quick-start.js`)

### Próximos Passos Sugeridos
1. Carregar dados de exemplo (projetos + hotspots)
2. Implementar dashboard admin funcional (conectar ao backend)
3. Adicionar proteção contra CSRF
4. Implementar 2FA para admin
5. Adicionar analytics de acesso

---

**Relatório Gerado:** 22/12/2025  
**Desenvolvedor:** GitHub Copilot  
**Status do Projeto:** ✅ **FUNCIONAL** (pronto para testes locais)
