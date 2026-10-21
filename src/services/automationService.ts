/**
 * Serviço de Automação Contínua & Piloto Automático 100% Autônomo do CampoBR
 * 
 * Regras Oficiais:
 * 1. Frequência: 2 publicações por dia, todos os dias do ano (365 dias/ano = 730 matérias anuais):
 *    - Edição 1 (Almoço / Manhã): ~11h45 BRT (com margem orgânica anti-robô entre 11h35 e 12h05)
 *    - Edição 2 (Fim de Tarde / Noite): ~18h45 BRT (com margem orgânica anti-robô entre 18h35 e 19h15)
 * 2. Bloqueio Rigoroso Anti-Duplicação: Verifica no banco de dados se a edição daquele slot específico já existe hoje.
 * 3. Rotação Cíclica das 6 Categorias Oficiais:
 *    - 2 categorias distintas por dia avançando suavemente ao longo do ano.
 * 4. Padrão Editorial OBRIGATÓRIO (Alto Valor para Google AdSense e Shopee Afiliados):
 *    - Texto Informativo Completo com SEO em bloco único contínuo: exatamente entre 760 e 970 palavras.
 *    - 2 blocos de apoio informativos ao final (20 a 70 palavras cada).
 *    - Sem fragmentações desnecessárias, tabelas soltas ou thin content.
 * 5. Evolução Contínua de Conhecimento (Self-Learning):
 *    - O robô aprende com a audiência e refina os ângulos de atração a cada ciclo.
 * 6. Toda nova postagem assume o Destaque Principal do site (featured: true).
 */

import { Post, FootballCategory, DailySlotConfig, AutomationConfig } from '../types';
import { 
  googleContentAssistant, 
  OFFICIAL_CYCLE_CATEGORIES, 
  getNextCategoryInCycle 
} from './googleContentAssistant';
import { createNewPost, updateExistingPost, fetchAllPosts, db } from './firebase';
import { getRandomHumanOffset } from '../utils/humanSchedule';
import { knowledgeEvolutionService } from './knowledgeEvolutionService';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AUTOMATION_SETTINGS_KEY = 'campobr_automation_config_v5_twice_daily';
const AUTOMATION_LOGS_KEY = 'campobr_automation_logs_v5';
const FIRESTORE_AUTOMATION_DOC = 'automation_v5_twice_daily';

export type { DailySlotConfig, AutomationConfig };

export interface AutomationLogEntry {
  id: string;
  timestamp: string;
  type: 'auto_publish' | 'slot_generation' | 'manual_trigger' | 'system' | 'learning';
  title: string;
  category?: string;
  message: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

function getTodayString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Cria a configuração do slot matinal (~11h45 BRT)
 */
function createMorningSlot(dateStr: string, category: FootballCategory): DailySlotConfig {
  const offset = getRandomHumanOffset(); // -8 a +8 min
  const baseMinutes = 11 * 60 + 45 + offset;
  const h = Math.floor(baseMinutes / 60);
  const m = baseMinutes % 60;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const targetDate = new Date(`${dateStr}T${timeStr}:00-03:00`);

  return {
    slot: 'morning',
    label: 'Edição 1: Almoço / Manhã (~11h45 BRT)',
    baseTime: '11:45',
    offsetMinutes: offset,
    scheduledTime: timeStr,
    targetDate: dateStr,
    targetIso: targetDate.toISOString(),
    executed: false,
    category,
  };
}

/**
 * Cria a configuração do slot vespertino/noturno (~18h45 BRT)
 */
function createEveningSlot(dateStr: string, category: FootballCategory): DailySlotConfig {
  const offset = getRandomHumanOffset(); // -8 a +8 min
  const baseMinutes = 18 * 60 + 45 + offset;
  const h = Math.floor(baseMinutes / 60);
  const m = baseMinutes % 60;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const targetDate = new Date(`${dateStr}T${timeStr}:00-03:00`);

  return {
    slot: 'evening',
    label: 'Edição 2: Fim de Tarde / Noite (~18h45 BRT)',
    baseTime: '18:45',
    offsetMinutes: offset,
    scheduledTime: timeStr,
    targetDate: dateStr,
    targetIso: targetDate.toISOString(),
    executed: false,
    category,
  };
}

export const automationService = {
  getConfig(): AutomationConfig {
    const today = getTodayString();
    try {
      const raw = localStorage.getItem(AUTOMATION_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AutomationConfig;
        if (parsed.lastRunDate === today && parsed.slotMorning && parsed.slotEvening) {
          // Mantém wrappers de compatibilidade
          parsed.slotToday = !parsed.slotMorning.executed ? parsed.slotMorning : parsed.slotEvening;
          parsed.slotsToday = {
            morning: parsed.slotMorning,
            lunch: parsed.slotMorning,
            noon: parsed.slotMorning,
            night: parsed.slotEvening,
          };
          return parsed;
        }

        // Novo dia: avança as categorias no ciclo oficial de 6 categorias
        const lastCatEvening = parsed.slotEvening?.category || OFFICIAL_CYCLE_CATEGORIES[1];
        const nextMorningCat = getNextCategoryInCycle(lastCatEvening);
        const nextEveningCat = getNextCategoryInCycle(nextMorningCat);

        const morningSlot = createMorningSlot(today, nextMorningCat);
        const eveningSlot = createEveningSlot(today, nextEveningCat);

        const fresh: AutomationConfig = {
          enabled: parsed.enabled ?? true,
          autoPublishScheduled: parsed.autoPublishScheduled ?? true,
          lastRunDate: today,
          frequency: 'twice_daily',
          slotMorning: morningSlot,
          slotEvening: eveningSlot,
          slotToday: morningSlot,
          slotsToday: {
            morning: morningSlot,
            lunch: morningSlot,
            noon: morningSlot,
            night: eveningSlot,
          },
        };
        this.saveConfig(fresh);
        return fresh;
      }
    } catch {
      // fallback
    }

    const morningSlot = createMorningSlot(today, OFFICIAL_CYCLE_CATEGORIES[0]);
    const eveningSlot = createEveningSlot(today, OFFICIAL_CYCLE_CATEGORIES[1]);

    const initial: AutomationConfig = {
      enabled: true,
      autoPublishScheduled: true,
      lastRunDate: today,
      frequency: 'twice_daily',
      slotMorning: morningSlot,
      slotEvening: eveningSlot,
      slotToday: morningSlot,
      slotsToday: {
        morning: morningSlot,
        lunch: morningSlot,
        noon: morningSlot,
        night: eveningSlot,
      },
    };
    this.saveConfig(initial);
    return initial;
  },

  saveConfig(config: AutomationConfig): void {
    // Mantém sincronizados os wrappers de compatibilidade
    if (config.slotMorning && config.slotEvening) {
      config.slotToday = !config.slotMorning.executed ? config.slotMorning : config.slotEvening;
      config.slotsToday = {
        morning: config.slotMorning,
        lunch: config.slotMorning,
        noon: config.slotMorning,
        night: config.slotEvening,
      };
    }

    try {
      localStorage.setItem(AUTOMATION_SETTINGS_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Erro ao salvar configuração local de automação', e);
    }

    // Sincroniza em nuvem no Firestore
    if (db) {
      try {
        setDoc(doc(db, 'system_state', FIRESTORE_AUTOMATION_DOC), config, { merge: true })
          .catch(err => console.warn('Sync Firestore automação:', err));
        
        // Mantém doc v4 legado atualizado para clientes antigos
        setDoc(doc(db, 'system_state', 'automation_v4_noon'), {
          lastRunDate: config.lastRunDate,
          slotToday: config.slotToday,
          enabled: config.enabled,
        }, { merge: true }).catch(() => {});
      } catch {
        // silencioso se offline
      }
    }
  },

  async syncFromFirestore(): Promise<AutomationConfig> {
    const local = this.getConfig();
    if (!db) return local;

    try {
      const snap = await getDoc(doc(db, 'system_state', FIRESTORE_AUTOMATION_DOC));
      if (snap.exists()) {
        const cloudData = snap.data() as AutomationConfig;
        const today = getTodayString();
        if (cloudData.lastRunDate === today && cloudData.slotMorning && cloudData.slotEvening) {
          const merged: AutomationConfig = {
            ...local,
            ...cloudData,
            slotMorning: cloudData.slotMorning.executed ? cloudData.slotMorning : local.slotMorning,
            slotEvening: cloudData.slotEvening.executed ? cloudData.slotEvening : local.slotEvening,
          };
          merged.slotToday = !merged.slotMorning.executed ? merged.slotMorning : merged.slotEvening;
          merged.slotsToday = {
            morning: merged.slotMorning,
            lunch: merged.slotMorning,
            noon: merged.slotMorning,
            night: merged.slotEvening,
          };
          this.saveConfig(merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar do Firestore:', err);
    }
    return local;
  },

  getLogs(): AutomationLogEntry[] {
    try {
      const raw = localStorage.getItem(AUTOMATION_LOGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  },

  addLog(entry: Omit<AutomationLogEntry, 'id' | 'timestamp'>): void {
    const logs = this.getLogs();
    const newEntry: AutomationLogEntry = {
      ...entry,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    const updated = [newEntry, ...logs.slice(0, 49)];
    try {
      localStorage.setItem(AUTOMATION_LOGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  clearLogs(): void {
    try {
      localStorage.removeItem(AUTOMATION_LOGS_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Promove a nova matéria para o Destaque Principal do site
   */
  async promotePostToHeroSpotlight(newPostId: string): Promise<void> {
    try {
      const all = await fetchAllPosts();
      const olderFeatured = all.filter(p => p.id !== newPostId && p.featured);
      for (const oldPost of olderFeatured) {
        await updateExistingPost(oldPost.id, { featured: false });
      }
    } catch (err) {
      console.warn('Erro ao desmarcar destaques anteriores:', err);
    }
  },

  /**
   * Rotina central do Piloto Automático 2x ao dia:
   * 1. Publica matérias agendadas pendentes
   * 2. Verifica e executa o slot da Manhã (~11h45) se o horário chegou e ainda não foi postado
   * 3. Verifica e executa o slot da Noite (~18h45) se o horário chegou e ainda não foi postado
   * 4. Garante padrão de 760-970 palavras + 2 blocos de apoio
   * 5. Evolui o conhecimento assimilando métricas de atração
   */
  async checkAndRun(onRefreshRequired?: () => void): Promise<{ publishedCount: number; generatedCount: number }> {
    let config = this.getConfig();
    let publishedCount = 0;
    let generatedCount = 0;
    const now = new Date();
    const today = getTodayString();

    try {
      config = await this.syncFromFirestore();
    } catch {
      // segue com local
    }

    // 1. Processa Matérias Agendadas Pendentes
    if (config.autoPublishScheduled) {
      try {
        const posts = await fetchAllPosts();
        const pending = posts.filter(p => {
          if (p.status !== 'scheduled') return false;
          if (!p.scheduledFor && !p.publishedAt) return false;
          const targetTime = new Date(p.scheduledFor || p.publishedAt).getTime();
          return targetTime <= now.getTime();
        });

        for (const post of pending) {
          await updateExistingPost(post.id, {
            status: 'published',
            publishedAt: now.toISOString(),
            featured: true,
          });
          await this.promotePostToHeroSpotlight(post.id);

          publishedCount++;
          this.addLog({
            type: 'auto_publish',
            title: post.title,
            category: post.category,
            message: `Matéria agendada foi publicada com sucesso em Destaque Principal.`,
            status: 'success',
          });
        }
      } catch (err) {
        console.warn('Erro ao verificar matérias agendadas:', err);
      }
    }

    if (!config.enabled) {
      return { publishedCount, generatedCount };
    }

    const posts = await fetchAllPosts();
    const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes();

    // 2. Executa Slot 1: Almoço / Manhã (~11h45)
    const morningSlotTag = `auto-slot-morning-${today}`;
    const alreadyMorning = posts.find(p => 
      p.tags?.includes(morningSlotTag) || 
      (p.automationSlot === 'morning' && p.automationDate === today)
    );

    if (alreadyMorning && !config.slotMorning.executed) {
      config.slotMorning.executed = true;
      config.slotMorning.executedPostId = alreadyMorning.id;
      config.slotMorning.executedPostTitle = alreadyMorning.title;
      this.saveConfig(config);
    }

    if (!config.slotMorning.executed) {
      const [mh, mm] = config.slotMorning.scheduledTime.split(':').map(Number);
      const morningScheduledMinutes = mh * 60 + mm;

      if (currentMinutesOfDay >= morningScheduledMinutes) {
        try {
          config.slotMorning.executed = true;
          this.saveConfig(config);

          const post = await this.executeSlotGeneration('morning', config.slotMorning.category);
          config.slotMorning.executedPostId = post.id;
          config.slotMorning.executedPostTitle = post.title;
          this.saveConfig(config);
          generatedCount++;

          this.addLog({
            type: 'slot_generation',
            title: post.title,
            category: post.category,
            message: `Edição 1 (Almoço/Manhã - ${config.slotMorning.scheduledTime}) gerada com sucesso! 760-970 palavras, 2 blocos de apoio e Destaque Principal.`,
            status: 'success',
          });
        } catch (err) {
          console.error('Erro ao gerar slot da manhã:', err);
          config.slotMorning.executed = false;
          this.saveConfig(config);
        }
      }
    }

    // 3. Executa Slot 2: Fim de Tarde / Noite (~18h45)
    const eveningSlotTag = `auto-slot-evening-${today}`;
    const alreadyEvening = posts.find(p => 
      p.tags?.includes(eveningSlotTag) || 
      (p.automationSlot === 'evening' && p.automationDate === today)
    );

    if (alreadyEvening && !config.slotEvening.executed) {
      config.slotEvening.executed = true;
      config.slotEvening.executedPostId = alreadyEvening.id;
      config.slotEvening.executedPostTitle = alreadyEvening.title;
      this.saveConfig(config);
    }

    if (!config.slotEvening.executed) {
      const [eh, em] = config.slotEvening.scheduledTime.split(':').map(Number);
      const eveningScheduledMinutes = eh * 60 + em;

      if (currentMinutesOfDay >= eveningScheduledMinutes) {
        try {
          config.slotEvening.executed = true;
          this.saveConfig(config);

          const post = await this.executeSlotGeneration('evening', config.slotEvening.category);
          config.slotEvening.executedPostId = post.id;
          config.slotEvening.executedPostTitle = post.title;
          this.saveConfig(config);
          generatedCount++;

          this.addLog({
            type: 'slot_generation',
            title: post.title,
            category: post.category,
            message: `Edição 2 (Fim de Tarde/Noite - ${config.slotEvening.scheduledTime}) gerada com sucesso! 760-970 palavras, 2 blocos de apoio e Destaque Principal.`,
            status: 'success',
          });
        } catch (err) {
          console.error('Erro ao gerar slot da noite:', err);
          config.slotEvening.executed = false;
          this.saveConfig(config);
        }
      }
    }

    if ((publishedCount > 0 || generatedCount > 0) && onRefreshRequired) {
      onRefreshRequired();
    }

    return { publishedCount, generatedCount };
  },

  /**
   * Executa a geração de um slot específico ('morning' ou 'evening')
   */
  async executeSlotGeneration(slot: 'morning' | 'evening', category: FootballCategory): Promise<Post> {
    const today = getTodayString();
    const now = new Date();
    const allPosts = await fetchAllPosts();

    // Alimenta o Gemini com diretrizes de atração aprendidas com os leitores
    const knowledgeState = knowledgeEvolutionService.getState(allPosts);
    const dynamicDirectives = knowledgeEvolutionService.buildDynamicPromptDirectives(category, knowledgeState);

    const article = await googleContentAssistant.generateFullArticle(
      undefined, 
      category, 
      undefined, 
      allPosts, 
      dynamicDirectives
    );

    const slug = article.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 100);

    const slotTag = `auto-slot-${slot}-${today}`;
    const slotLabel = slot === 'morning' ? 'Edição Almoço (~11h45 BRT)' : 'Edição Noite (~18h45 BRT)';

    const created = await createNewPost({
      title: article.title,
      slug,
      summary: article.summary,
      content: article.content,
      category: article.category,
      coverImage: article.coverImage || '',
      imageGenerationSource: article.imageGenerationSource,
      reviewedBy: article.reviewedBy,
      editorialStatus: article.editorialStatus,
      reviewNotes: article.reviewNotes,
      aiImageMention: article.aiImageMention || 'Registro visual de alta definição capturando a emoção e o dinamismo do futebol brasileiro.',
      thematicConcept: article.thematicConcept,
      visualMood: article.visualMood,
      authorName: article.authorName || 'Thiago Valverde',
      authorRole: article.authorRole || 'Editor-Chefe & Analista Tático',
      authorAvatar: '/logo-512x512.png',
      featured: true, // OBRIGATÓRIO: assume destaque principal
      readTimeMinutes: article.suggestedReadingTime || 6,
      tags: [...article.tags, slotTag, 'Futebol Brasileiro', 'Brasileirão', slotLabel, 'auto-' + today],
      publishedAt: now.toISOString(),
      status: 'published',
      automationDate: today,
      automationSlot: slot,
    });

    await this.promotePostToHeroSpotlight(created.id);

    // Registra no cérebro de evolução contínua para aprendizado cumulativo
    knowledgeEvolutionService.recordPostEvolution({
      title: created.title,
      category: created.category,
    });

    return created;
  },

  /**
   * Força a execução de um dos slots diários sob demanda
   */
  async forceExecuteSlot(slot: 'morning' | 'evening', onRefreshRequired?: () => void): Promise<Post> {
    const config = this.getConfig();
    const targetSlotConfig = slot === 'morning' ? config.slotMorning : config.slotEvening;
    const category = targetSlotConfig.category || OFFICIAL_CYCLE_CATEGORIES[0];

    const post = await this.executeSlotGeneration(slot, category);

    if (slot === 'morning') {
      config.slotMorning.executed = true;
      config.slotMorning.executedPostId = post.id;
      config.slotMorning.executedPostTitle = post.title;
    } else {
      config.slotEvening.executed = true;
      config.slotEvening.executedPostId = post.id;
      config.slotEvening.executedPostTitle = post.title;
    }
    this.saveConfig(config);

    this.addLog({
      type: 'manual_trigger',
      title: post.title,
      category: post.category,
      message: `Disparo Manual: ${targetSlotConfig.label} gerada com sucesso em Destaque Principal!`,
      status: 'success',
    });

    if (onRefreshRequired) onRefreshRequired();
    return post;
  },

  /**
   * Força a execução do próximo slot pendente do dia (para compatibilidade com botões existentes)
   */
  async forceExecuteDailySlot(onRefreshRequired?: () => void): Promise<Post> {
    const config = this.getConfig();
    if (!config.slotMorning.executed) {
      return this.forceExecuteSlot('morning', onRefreshRequired);
    }
    return this.forceExecuteSlot('evening', onRefreshRequired);
  },

  /**
   * Gera matéria imediata com rotação livre e alta qualidade
   */
  async generateDiverseInstantPost(forcedCategory?: FootballCategory, onRefreshRequired?: () => void): Promise<Post> {
    const randomCat = forcedCategory || OFFICIAL_CYCLE_CATEGORIES[Math.floor(Math.random() * OFFICIAL_CYCLE_CATEGORIES.length)];
    const post = await this.executeSlotGeneration('morning', randomCat);

    this.addLog({
      type: 'manual_trigger',
      title: post.title,
      category: post.category,
      message: `Matéria Avulsa: Gerada na categoria "${post.category}" com 760-970 palavras, 2 blocos de apoio e Destaque Principal.`,
      status: 'success',
    });

    if (onRefreshRequired) onRefreshRequired();
    return post;
  },

  async generateDualScheduledGrade(forcedCategory?: FootballCategory, onRefreshRequired?: () => void): Promise<Post[]> {
    const post = await this.forceExecuteDailySlot(onRefreshRequired);
    return [post];
  },

  async generateTripleScheduledGrade(forcedCategory?: FootballCategory, onRefreshRequired?: () => void): Promise<Post[]> {
    const post = await this.forceExecuteDailySlot(onRefreshRequired);
    return [post];
  }
};
