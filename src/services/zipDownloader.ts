// Download seguro e inteligente do pacote dist

/**
 * Verifica se a aplicação está rodando no ambiente do projeto (AI Studio / Cloud Run / Localhost)
 * ou se já está publicada no domínio do blog (campobr.blog / netlify).
 * Garante que opções de download de código/build apareçam apenas aqui no projeto.
 */
export function isProjectEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = (window.location.hostname || '').toLowerCase();

  // Se estiver no domínio oficial do blog ou no Netlify, é o blog em produção
  if (host === 'campobr.blog' || host === 'www.campobr.blog' || host.includes('netlify.app')) {
    return false;
  }

  // Ambiente de desenvolvimento do AI Studio (Cloud Run) ou Localhost
  return (
    host.includes('run.app') ||
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('googleusercontent.com') ||
    host.includes('webcontainer') ||
    host.includes('github.dev') ||
    host.includes('stackblitz')
  );
}

/**
 * Converte a string Base64 em um Blob binário real do tipo application/zip
 */
export function base64ToZipBlob(base64: string): Blob {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'application/zip' });
}

/**
 * Dispara o download de um Blob no navegador
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Ignorar se já removido
    }
  }, 10000);
}

/**
 * Faz o download do arquivo ZIP de forma 100% infalível:
 * 1. Tenta baixar o arquivo físico via fetch do endpoint estático.
 * 2. Se falhar ou estiver em iframe restrito, carrega o Base64 sob demanda via dynamic import.
 * 3. Fallback de segurança abrindo em nova janela.
 */
export async function downloadDistZipReliable(): Promise<boolean> {
  try {
    const res = await fetch('/download/campobr-dist-pronto.zip');
    if (res.ok) {
      const blob = await res.blob();
      triggerBlobDownload(blob, 'campobr-dist-pronto.zip');
      return true;
    }
  } catch (err) {
    console.warn('Fetch direto falhou, tentando decodificação em memória...', err);
  }

  try {
    const { DIST_ZIP_BASE64 } = await import('./zipDistBase64');
    if (DIST_ZIP_BASE64) {
      const blob = base64ToZipBlob(DIST_ZIP_BASE64);
      triggerBlobDownload(blob, 'campobr-dist-pronto.zip');
      return true;
    }
  } catch (error) {
    console.error('Falha ao gerar blob em memória, abrindo em nova aba:', error);
  }

  window.open('/download/campobr-dist-pronto.zip', '_blank');
  return false;
}

export async function downloadSourceZipReliable(): Promise<boolean> {
  // 1. Decodificação em memória 100% infalível (independe de cookies, proxies ou restrições de rede)
  try {
    const { SOURCE_ZIP_BASE64 } = await import('./zipSourceBase64');
    if (SOURCE_ZIP_BASE64) {
      const blob = base64ToZipBlob(SOURCE_ZIP_BASE64);
      triggerBlobDownload(blob, 'campobr-codigo-fonte.zip');
      return true;
    }
  } catch (err) {
    console.warn('Decodificação em memória do código-fonte falhou, tentando fetch estático...', err);
  }

  // 2. Fallback de fetch direto
  try {
    const res = await fetch('/download/campobr-codigo-fonte.zip');
    if (res.ok) {
      const blob = await res.blob();
      triggerBlobDownload(blob, 'campobr-codigo-fonte.zip');
      return true;
    }
  } catch (err) {
    console.warn('Fetch direto do código-fonte falhou, abrindo via link direto...', err);
  }

  const link = document.createElement('a');
  link.href = '/download/campobr-codigo-fonte.zip';
  link.download = 'campobr-codigo-fonte.zip';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

// Aliases para compatibilidade retroativa
export const downloadDistZip = downloadDistZipReliable;
export const downloadSourceZip = downloadSourceZipReliable;
