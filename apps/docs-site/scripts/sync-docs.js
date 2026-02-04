#!/usr/bin/env node

/**
 * Script de sincronização de documentos para o Docusaurus
 * 
 * Este script copia arquivos markdown dos diretórios originais para
 * apps/docs-site/docs/ antes do build, eliminando duplicação.
 * 
 * Estrutura copiada:
 * - ../../docs/index.md e vps.md → docs/
 * - ../../README.md → docs/readme.md
 * - ../qual-carreira-seguir/docs/* → docs/qual-carreira-seguir/
 * - ../dashboard/README.md → docs/dashboard/readme.md
 */

const fs = require('fs');
const path = require('path');

// Cores para logs (opcional, funciona sem cores também)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Diretório base do script (apps/docs-site/)
const scriptDir = __dirname;
const docsSiteDir = path.resolve(scriptDir, '..');
const docsTargetDir = path.resolve(docsSiteDir, 'docs');
const projectRoot = path.resolve(docsSiteDir, '../..');

// Caminhos dos arquivos originais
const paths = {
  docsIndex: path.resolve(projectRoot, 'docs', 'index.md'),
  docsVps: path.resolve(projectRoot, 'docs', 'vps.md'),
  readme: path.resolve(projectRoot, 'README.md'),
  qualCarreiraDocs: path.resolve(docsSiteDir, '..', 'qual-carreira-seguir', 'docs'),
  dashboardReadme: path.resolve(docsSiteDir, '..', 'dashboard', 'README.md'),
};

/**
 * Limpa o diretório docs/ mantendo apenas .gitkeep se existir
 */
function cleanDocsDir() {
  log('🧹 Limpando diretório docs/...', 'blue');
  
  if (!fs.existsSync(docsTargetDir)) {
    fs.mkdirSync(docsTargetDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(docsTargetDir);
  for (const file of files) {
    if (file === '.gitkeep') continue; // Preservar .gitkeep
    
    const filePath = path.resolve(docsTargetDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }
  
  log('✅ Diretório docs/ limpo', 'green');
}

/**
 * Copia um arquivo de origem para destino
 */
function copyFile(source, dest, description) {
  if (!fs.existsSync(source)) {
    log(`⚠️  ${description}: arquivo não encontrado (${source})`, 'yellow');
    return false;
  }

  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(source, dest);
  log(`✅ ${description}: ${path.basename(source)} → ${path.relative(docsSiteDir, dest)}`, 'green');
  return true;
}

/**
 * Converte nome de arquivo para formato Docusaurus
 * - Lowercase
 * - Underscores para hífens
 */
function normalizeFileName(filename) {
  return filename
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\.md$/, '.md'); // Garantir extensão .md
}

/**
 * Copia arquivos do diretório docs/ do top level
 */
function copyTopLevelDocs() {
  log('📄 Copiando documentos do top level (docs/)...', 'blue');
  
  copyFile(paths.docsIndex, path.resolve(docsTargetDir, 'index.md'), 'index.md');
  copyFile(paths.docsVps, path.resolve(docsTargetDir, 'vps.md'), 'vps.md');
}

/**
 * Copia README.md do top level
 */
function copyReadme() {
  log('📄 Copiando README.md do top level...', 'blue');
  
  const dest = path.resolve(docsTargetDir, 'readme.md');
  copyFile(paths.readme, dest, 'README.md');
}

/**
 * Copia documentos do QualCarreira
 */
function copyQualCarreiraDocs() {
  log('📚 Copiando documentos do QualCarreira...', 'blue');
  
  if (!fs.existsSync(paths.qualCarreiraDocs)) {
    log(`⚠️  Diretório QualCarreira docs não encontrado: ${paths.qualCarreiraDocs}`, 'yellow');
    return;
  }

  const qualCarreiraTargetDir = path.resolve(docsTargetDir, 'qual-carreira-seguir');
  if (!fs.existsSync(qualCarreiraTargetDir)) {
    fs.mkdirSync(qualCarreiraTargetDir, { recursive: true });
  }

  const files = fs.readdirSync(paths.qualCarreiraDocs);
  let copiedCount = 0;

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const source = path.resolve(paths.qualCarreiraDocs, file);
    const normalizedName = normalizeFileName(file);
    const dest = path.resolve(qualCarreiraTargetDir, normalizedName);

    if (copyFile(source, dest, `QualCarreira: ${file}`)) {
      copiedCount++;
    }
  }

  log(`✅ ${copiedCount} arquivo(s) do QualCarreira copiado(s)`, 'green');
}

/**
 * Copia README do Dashboard
 */
function copyDashboardReadme() {
  log('📊 Copiando README do Dashboard...', 'blue');
  
  const dashboardTargetDir = path.resolve(docsTargetDir, 'dashboard');
  if (!fs.existsSync(dashboardTargetDir)) {
    fs.mkdirSync(dashboardTargetDir, { recursive: true });
  }

  const dest = path.resolve(dashboardTargetDir, 'readme.md');
  copyFile(paths.dashboardReadme, dest, 'Dashboard README');
}

/**
 * Função principal
 */
function main() {
  log('🚀 Iniciando sincronização de documentos...\n', 'blue');

  try {
    // 1. Limpar diretório docs/
    cleanDocsDir();

    // 2. Copiar documentos do top level
    copyTopLevelDocs();

    // 3. Copiar README do top level
    copyReadme();

    // 4. Copiar documentos do QualCarreira
    copyQualCarreiraDocs();

    // 5. Copiar README do Dashboard
    copyDashboardReadme();

    log('\n✅ Sincronização concluída com sucesso!', 'green');
    process.exit(0);
  } catch (error) {
    log(`\n❌ Erro durante sincronização: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar
main();
