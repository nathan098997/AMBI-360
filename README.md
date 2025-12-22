# AMBI360 - Plataforma de Tours Virtuais 360°

![AMBI360 Logo](frontend/logo-ambi360.svg)

Uma plataforma completa para criação e visualização de tours virtuais 360° com sistema de gestão de projetos, hotspots interativos e navegação sequencial.

## 🚀 Funcionalidades

### Para Usuários
- **Navegação Intuitiva**: Interface lateral com ambientes disponíveis
- **Hotspots Interativos**: Pontos clicáveis para navegação entre cenas
- **Controles Avançados**: Zoom, rotação, tela cheia e ajuda
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Desbloqueio Progressivo**: Sistema tipo Google Maps para exploração

### Para Administradores
- **Painel de Gestão**: Interface completa para gerenciar projetos
- **Criação de Projetos**: Upload de imagens 360° e configuração
- **Editor de Hotspots**: Adicione pontos interativos com preview em tempo real
- **Logos Personalizadas**: Upload de logos para cada projeto
- **Modo Escuro**: Interface adaptável para diferentes preferências
- **Backup Automático**: Sistema de backup no GitHub

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design moderno com variáveis CSS e animações
- **JavaScript ES6+**: Lógica da aplicação e gerenciamento de estado
- **Pannellum**: Biblioteca para visualização de panoramas 360°

### Backend
- **Node.js**: Servidor backend
- **Express.js**: Framework web
- **MySQL**: Banco de dados relacional
- **JWT**: Autenticação segura

## 📁 Estrutura do Projeto

```
AMBI-360/
├── frontend/                 # Arquivos do frontend
│   ├── index.html           # Página principal
│   ├── style.css            # Estilos principais
│   ├── hotspots.css         # Estilos dos hotspots
│   ├── script.js            # Lógica da aplicação
│   └── assets/              # Imagens e recursos
├── backend/                 # Servidor Node.js
│   ├── server.js            # Servidor principal
│   ├── config/              # Configurações
│   │   └── db.js            # Conexão com banco
│   ├── routes/              # Rotas da API
│   └── models/              # Modelos de dados
├── database.sql             # Estrutura do banco de dados
├── .env.example             # Exemplo de variáveis de ambiente
├── .gitignore               # Arquivos ignorados pelo Git
├── package.json             # Dependências do projeto
└── README.md                # Este arquivo
```

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- MySQL (versão 5.7 ou superior)
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/nathan098997/ambi360.git
cd ambi360
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados

#### 3.1. Crie o banco de dados MySQL
```bash
# Entre no MySQL
mysql -u root -p

# Execute o arquivo SQL
source database.sql
```

#### 3.2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
# Exemplo:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=ambi360_db
```

### 4. Inicie o servidor
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

### 5. Acesse a aplicação
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## 🔐 Configuração de Segurança

### Credenciais Padrão
- **Senha Admin**: `admin123` (altere após primeiro acesso)

### Configuração do .env
```env
# IMPORTANTE: Configure estas variáveis antes de usar em produção
DB_PASSWORD=sua_senha_mysql
APP_SECRET_KEY=chave_secreta_aleatoria
JWT_SECRET=jwt_secret_muito_seguro
SESSION_SECRET=session_secret_aleatorio
```

## 📊 Banco de Dados

### ⚠️ IMPORTANTE: Dados NÃO estão no GitHub
- O banco de dados **NÃO** está versionado no GitHub
- Apenas a **estrutura** (database.sql) está incluída
- **Dados reais** e **senhas** devem ser configurados localmente

### Estrutura Principal
- **users**: Usuários e administradores
- **projects**: Projetos de tours 360°
- **hotspots**: Pontos interativos nas cenas
- **user_progress**: Progresso de desbloqueio dos usuários
- **access_logs**: Logs de acesso para analytics

## 🚀 Deploy

### Desenvolvimento Local
```bash
npm run dev
```

### Produção
1. Configure as variáveis de ambiente de produção
2. Execute as migrações do banco de dados
3. Inicie o servidor:
```bash
npm start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Nathan098997**
- GitHub: [@nathan098997](https://github.com/nathan098997)

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se o banco de dados está configurado corretamente
3. Verifique se o arquivo `.env` está configurado
4. Abra uma [issue](https://github.com/nathan098997/ambi360/issues) no GitHub

---

**AMBI360** - Transformando espaços em experiências virtuais imersivas. 🌐