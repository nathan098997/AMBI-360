# AMBI360 - Plataforma de Tours Virtuais 360°

Uma plataforma completa para criação e visualização de tours virtuais 360° com sistema de gestão de projetos, hotspots interativos e navegação sequencial.

## 🚀 Funcionalidades

### Para Usuários
- **Login por Projeto**: Acesso individual a cada tour virtual
- **Navegação Intuitiva**: Interface lateral com ambientes disponíveis
- **Hotspots Interativos**: Pontos clicáveis para navegação entre cenas
- **Controles Avançados**: Zoom, rotação, tela cheia e ajuda
- **Design Responsivo**: Funciona perfeitamente em desktop e mobile

### Para Administradores
- **Painel de Gestão**: Interface completa para gerenciar projetos
- **Criação de Projetos**: Upload de imagens 360° e configuração
- **Editor de Hotspots**: Adicione pontos interativos com preview em tempo real
- **Logos Personalizadas**: Upload de logos para cada projeto
- **Modo Escuro**: Interface adaptável para diferentes preferências
- **Navegação Sequencial**: Sistema inteligente de progressão entre cenas

## 🎯 Como Usar

### Acesso como Usuário
1. Na tela inicial, mantenha o toggle em "Usuário"
2. Digite o nome do projeto e senha
3. Clique em "Entrar" para acessar o tour virtual
4. Use a navegação lateral para explorar os ambientes
5. Clique nos hotspots para navegar entre as cenas

### Acesso como Administrador
1. Na tela inicial, mude o toggle para "Admin"
2. Digite a senha: `admin123`
3. Clique em "Entrar como Admin"

### Gerenciando Projetos
1. **Visualizar Projetos**: Veja todos os projetos na grade principal
2. **Criar Novo Projeto**:
   - Clique em "Criar Projeto"
   - Preencha nome, senha e título
   - Faça upload da logo (opcional)
   - Faça upload da imagem 360° principal
   - Configure hotspots na prévia
   - Salve o projeto

3. **Editar Projeto**: Clique no botão "Editar" em qualquer projeto
4. **Visualizar**: Use "Ver" para testar o projeto como usuário
5. **Excluir**: Remove permanentemente o projeto

### Configurando Hotspots
1. Na prévia da imagem, clique em "Adicionar Ponto"
2. Clique na posição desejada na imagem 360°
3. Configure o nome e tipo do ponto (Normal ou Porta)
4. Faça upload da imagem 360° de destino
5. Use "Entrar no Ponto" para adicionar sub-hotspots
6. Ajuste a posição com os controles direcionais

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design moderno com variáveis CSS e animações
- **JavaScript ES6+**: Lógica da aplicação e gerenciamento de estado
- **Pannellum**: Biblioteca para visualização de panoramas 360°
- **LocalStorage**: Persistência de dados no navegador
- **SVG**: Ícones e logos vetoriais

## 📁 Estrutura do Projeto

```
AMBI-360/
├── index.html          # Página principal
├── style.css           # Estilos principais
├── hotspots.css        # Estilos dos hotspots
├── script.js           # Lógica da aplicação
└── README.md           # Este arquivo
```

## 🎨 Características do Design

### Interface de Login
- Gradiente moderno azul
- Toggle animado usuário/admin
- Formulários responsivos
- Feedback visual de erros

### Painel Administrativo
- Sidebar com navegação clara
- Grid responsivo de projetos
- Formulários intuitivos
- Preview em tempo real

### Visualizador 360°
- Navegação lateral contextual
- Controles de tela cheia
- Hotspots animados
- Sistema de ajuda integrado

### Hotspots Personalizados
- **Normal**: Círculo azul com ícone de olho
- **Porta**: Quadrado vermelho com ícone de porta
- **Voltar**: Círculo cinza com seta
- Animações de pulso e hover

## 🔧 Configuração

### Projetos Padrão
O sistema vem com 2 projetos de demonstração:
- **projeto-demo** (senha: 123456)
- **casa-modelo** (senha: casa2024)

### Credenciais de Admin
- Senha padrão: `admin123`

### Personalização
- Modifique as variáveis CSS em `:root` para alterar cores
- Ajuste `DEFAULT_PROJECTS` no JavaScript para projetos iniciais
- Altere `ADMIN_PASSWORD` para nova senha de admin

## 📱 Responsividade

- **Desktop**: Experiência completa com todas as funcionalidades
- **Tablet**: Layout adaptado com navegação otimizada
- **Mobile**: Interface compacta com controles touch-friendly

## 🌙 Modo Escuro

- Toggle no painel administrativo
- Persistência da preferência
- Transições suaves entre temas
- Cores otimizadas para baixa luminosidade

## 🔒 Segurança

- Senhas armazenadas localmente
- Validação de formulários
- Sanitização de inputs
- Controle de acesso por projeto

## 🚀 Melhorias Futuras

- [ ] Integração com banco de dados
- [ ] Sistema de usuários avançado
- [ ] Analytics de visualização
- [ ] Compartilhamento de projetos
- [ ] Exportação de tours
- [ ] Integração com VR
- [ ] Áudio ambiente
- [ ] Hotspots com vídeo

## 📞 Suporte

Para dúvidas ou sugestões sobre o AMBI360, entre em contato através dos canais oficiais.

---

**AMBI360** - Transformando espaços em experiências virtuais imersivas.