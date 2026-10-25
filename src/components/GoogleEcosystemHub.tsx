import React, { useState } from 'react';
import { 
  Globe, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Tag, 
  CheckCircle2, 
  ExternalLink, 
  Activity, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Search,
  Eye,
  Sliders,
  DollarSign,
  Check
} from 'lucide-react';
import { valueAnalyticsService, GoogleToolStatus } from '../services/valueAnalyticsService';
import { AdSenseConfig } from '../types';

interface GoogleEcosystemHubProps {
  adsConfig: AdSenseConfig;
  onUpdateAdsConfig: (config: AdSenseConfig) => void;
}

export const GoogleEcosystemHub: React.FC<GoogleEcosystemHubProps> = ({
  adsConfig,
  onUpdateAdsConfig
}) => {
  const [tools, setTools] = useState<GoogleToolStatus[]>(valueAnalyticsService.getGoogleToolsEcosystemStatus());
  const [selectedTool, setSelectedTool] = useState<GoogleToolStatus>(tools[0]);
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  const categories = ['todos', 'SEO & Tráfego', 'Métricas de Valor', 'Performance & UX', 'Monetização & Tags'];

  const filteredTools = tools.filter(t => activeCategory === 'todos' || t.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/40 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Ecossistema Google Integrado
              </span>
              <span className="text-xs text-slate-400">• 8 Plataformas em Operação Conjunta</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              Central de Otimização & Diagnóstico Google
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Junção operacional das 8 plataformas do Google para máxima saúde técnica, indexação rápida no Google Discover e conformidade estrita com as políticas editoriais e de monetização.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs text-emerald-400 font-bold shrink-0 self-start md:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
            <span>8 de 8 Serviços Conectados</span>
          </div>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid das 8 Ferramentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const isSelected = selectedTool.id === tool.id;

          return (
            <div
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 relative group ${
                isSelected 
                  ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {tool.category}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {tool.status}
                </span>
              </div>

              <div>
                <h3 className="font-display font-black text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                    {tool.metricLabel}
                  </span>
                  <span className="font-bold text-slate-200 text-xs">
                    {tool.metricValue}
                  </span>
                </div>

                <a
                  href={tool.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Abrir console oficial"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Detalhes da Ferramenta Selecionada com Diagnóstico Operacional */}
      {selectedTool && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  {selectedTool.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-700">
                  Operação Ativa
                </span>
              </div>
              <h3 className="font-display font-black text-xl text-white">
                {selectedTool.name} — Painel de Integração & Diagnóstico
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {selectedTool.description}
              </p>
            </div>

            <a
              href={selectedTool.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
            >
              <span>Abrir Console Oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Checklist de Validação Técnica da Ferramenta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sinal / Métrica</span>
              <div className="text-white font-bold text-sm">{selectedTool.metricValue}</div>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Telemetria em conformidade
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status de Comunicação</span>
              <div className="text-emerald-400 font-bold text-sm">Sem Erros ou Bloqueios</div>
              <p className="text-[10px] text-slate-400">Zero comprometimento entre ferramentas</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Padrão de Qualidade</span>
              <div className="text-indigo-300 font-bold text-sm">Google Discover Ready</div>
              <p className="text-[10px] text-slate-400">Elegível para carrosséis e feeds ricos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
