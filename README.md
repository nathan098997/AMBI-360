# AMBI360 - Tours Virtuais 360°

## Deploy no GitHub Pages

### Passos para resolver o erro 404:

1. **Commit e Push dos arquivos criados:**
```bash
git add .
git commit -m "Fix: Adicionar configuração GitHub Pages"
git push origin main
```

2. **Configurar GitHub Pages:**
   - Vá para Settings > Pages no seu repositório
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Salve as configurações

3. **Aguardar o deploy:**
   - O GitHub Actions irá executar automaticamente
   - Verifique em Actions se o deploy foi bem-sucedido

### Arquivos criados para resolver o problema:
- `.nojekyll` - Evita processamento Jekyll
- `.github/workflows/deploy.yml` - Workflow de deploy automático

### URL do projeto:
Após o deploy, acesse: `https://[seu-usuario].github.io/[nome-do-repositorio]`