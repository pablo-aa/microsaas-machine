import { createClient } from '@supabase/supabase-js';

// Detecta o ambiente baseado no hostname
const isProduction = () => {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    const hostname = window.location.hostname;
    // Produção apenas quando o domínio final estiver ativo
    return hostname === 'qualcarreira.com' || hostname === 'www.qualcarreira.com';
  } catch (error) {
    console.error('[Supabase] Error detecting environment:', error);
    return false;
  }
};

// Configurações por ambiente
const config = {
  dev: {
    url: 'https://sqmkerddgvshfqwgwnyc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbWtlcmRkZ3ZzaGZxd2d3bnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDAwMzgsImV4cCI6MjA3NTE3NjAzOH0.vtU5-sehEEcjziQwQwLif572LfRCwKh_6e-uYhD56fw'
  },
  prod: {
    url: 'https://iwovfvrmjaonzqlaavmi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3ZmdnJtamFvbnpxbGFhdm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTk0OTUsImV4cCI6MjA3NTE3NTQ5NX0.4EhcKmybFm3VVpMuR1hahaJbZxmVm9zbcwgB96Xm04I'
  }
};

// ⚠️ FORÇANDO PROD MESMO EM LOCALHOST PARA DEBUG
const env = 'prod'; // Sempre usa prod
const currentConfig = config[env];

export const supabase = createClient(currentConfig.url, currentConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper para debug
export const getCurrentEnvironment = () => env;
