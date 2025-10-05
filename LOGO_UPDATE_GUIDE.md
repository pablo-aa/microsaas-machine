# Guia de Atualização da Logo - QualCarreira

Este documento explica como atualizar a logo da QualCarreira de forma consistente em toda a aplicação.

## 📁 Onde a logo é utilizada

A logo atual da QualCarreira é um **gradiente roxo com as iniciais "QC"** em branco, definido por código nos componentes. Para trocar por uma **imagem personalizada**, siga os passos abaixo.

---

## 🔄 Passo a Passo para Atualizar a Logo

### 1. Preparar os arquivos da nova logo

Você precisará de **3 versões** da logo:

- **Logo completa (PNG/SVG)** - Para usar no Header, Footer e páginas
  - Tamanho recomendado: 200x50px ou proporcional
  - Formato: PNG com fundo transparente ou SVG
  - Nome sugerido: `logo-qualcarreira.png` ou `logo-qualcarreira.svg`

- **Logo pequena/ícone (PNG)** - Para usar como favicon
  - Tamanho: 32x32px ou 64x64px
  - Formato: PNG ou ICO
  - Nome sugerido: `favicon.png` ou `favicon.ico`

- **Logo para compartilhamento (PNG)** - Para Open Graph e redes sociais
  - Tamanho: 1200x630px (proporção ideal para compartilhamento)
  - Formato: PNG ou JPG
  - Nome sugerido: `og-image.png`

---

### 2. Adicionar os arquivos no projeto

**Coloque as imagens nas seguintes pastas:**

```
public/
  ├── favicon.png          (favicon do site)
  ├── og-image.png         (imagem Open Graph para compartilhamento)

src/assets/
  ├── logo-qualcarreira.png   (logo principal para importar nos componentes)
```

**Por que duas pastas diferentes?**
- `public/` - Para arquivos referenciados diretamente no HTML (favicon, meta tags)
- `src/assets/` - Para imagens importadas como módulos ES6 no React (melhor otimização)

---

### 3. Atualizar os componentes React

Você precisará editar **3 componentes** que usam a logo:

#### **src/components/Header.tsx**

```tsx
// NO TOPO DO ARQUIVO, adicione o import:
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

// SUBSTITUA a div do logo (linhas 11-15) por:
<Link to="/" className="flex items-center">
  <img 
    src={logoQualCarreira} 
    alt="QualCarreira - Teste Vocacional" 
    className="h-8 w-auto"
  />
</Link>
```

#### **src/components/Footer.tsx**

```tsx
// NO TOPO DO ARQUIVO, adicione o import:
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

// SUBSTITUA o Link com logo (linhas 10-15) por:
<Link to="/" className="flex items-center justify-center mb-4">
  <img 
    src={logoQualCarreira} 
    alt="QualCarreira - Teste Vocacional" 
    className="h-10 w-auto"
  />
</Link>
```

#### **src/components/ResultsFooter.tsx**

```tsx
// NO TOPO DO ARQUIVO, adicione o import:
import logoQualCarreira from "@/assets/logo-qualcarreira.png";

// SUBSTITUA o Link com logo (linhas 11-16) por:
<Link to="/" className="flex items-center space-x-2 mb-4">
  <img 
    src={logoQualCarreira} 
    alt="QualCarreira - Teste Vocacional" 
    className="h-8 w-auto"
  />
</Link>
```

---

### 4. Atualizar o favicon (ícone da aba do navegador)

Edite o arquivo **index.html** na raiz do projeto:

```html
<!-- SUBSTITUA a linha com <link rel="icon"> por: -->
<link rel="icon" type="image/png" href="/favicon.png" />
```

---

### 5. Atualizar meta tags Open Graph (compartilhamento social)

Edite o arquivo **index.html** na raiz do projeto:

```html
<!-- SUBSTITUA as meta tags og:image e twitter:image por: -->
<meta property="og:image" content="https://qualcarreira.com/og-image.png" />
<meta name="twitter:image" content="https://qualcarreira.com/og-image.png" />
```

**⚠️ IMPORTANTE:** Após fazer deploy, valide as imagens em:
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

### 6. (Opcional) Atualizar manifest.json para PWA

Se você tiver um arquivo **public/manifest.json** (para Progressive Web App), atualize:

```json
{
  "name": "QualCarreira - Teste Vocacional",
  "short_name": "QualCarreira",
  "icons": [
    {
      "src": "/favicon.png",
      "sizes": "64x64",
      "type": "image/png"
    },
    {
      "src": "/logo-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/logo-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Neste caso, você também precisará criar versões **192x192px** e **512x512px** da logo.

---

## ✅ Checklist Final

Após fazer as alterações, verifique:

- [ ] Logo aparece corretamente no **Header** (todas as páginas)
- [ ] Logo aparece corretamente no **Footer** (todas as páginas)
- [ ] Logo aparece corretamente na página de **Resultados**
- [ ] **Favicon** atualizado na aba do navegador
- [ ] Imagem de compartilhamento (**Open Graph**) funcionando
- [ ] Logo é **responsiva** (se ajusta bem no mobile)
- [ ] Logo tem bom **contraste** com o fundo (claro e escuro)

---

## 🎨 Dica Extra: Logo Responsiva

Se sua logo ficar muito grande no mobile, adicione classes Tailwind responsivas:

```tsx
<img 
  src={logoQualCarreira} 
  alt="QualCarreira" 
  className="h-6 sm:h-8 lg:h-10 w-auto"
/>
```

Isso fará a logo ter:
- **24px** de altura no mobile
- **32px** de altura em tablets
- **40px** de altura em desktop

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas, entre em contato: **suporte@qualcarreira.com**

---

**Última atualização:** 05/10/2025
