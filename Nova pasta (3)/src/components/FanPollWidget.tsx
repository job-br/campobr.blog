import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Flame, ThumbsUp, Users } from 'lucide-react';

interface FanPollWidgetProps {
  postId: string;
  category?: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export const FanPollWidget: React.FC<FanPollWidgetProps> = ({ postId, category }) => {
  const storageKey = `campobr_poll_vote_${postId}`;
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [options, setOptions] = useState<PollOption[]>([
    { id: 'opt-1', text: 'Concordo 100% com a análise tática', votes: 142 },
    { id: 'opt-2', text: 'Equilibrado, mas há ressalvas no meio-campo', votes: 89 },
    { id: 'opt-3', text: 'Discordo da postura adotada pela equipe', votes: 34 },
  ]);

  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(storageKey);
      if (savedVote) {
        setSelectedOption(savedVote);
      }
    } catch {
      // safe fallback
    }
  }, [storageKey]);

  const handleVote = (optionId: string) => {
    if (selectedOption) return; // Already voted

    setSelectedOption(optionId);
    try {
      localStorage.setItem(storageKey, optionId);
    } catch {
      // safe fallback
    }

    setOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-4">
      {/* Poll Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block leading-none">
              Opinião do Torcedor • CampoBR
            </span>
            <h4 className="font-display font-black text-sm sm:text-base text-white mt-0.5">
              Qual o seu veredito sobre o tema desta matéria?
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold">{totalVotes} votos</span>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-2.5">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              type="button"
              disabled={Boolean(selectedOption)}
              onClick={() => handleVote(option.id)}
              className={`w-full p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold'
                  : selectedOption
                  ? 'border-slate-800 bg-slate-900/50 text-slate-300'
                  : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/80 hover:bg-slate-900 text-slate-200'
              }`}
            >
              {/* Progress Bar background if voted */}
              {selectedOption && (
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500/15 transition-all duration-500 rounded-xl"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                  </span>
                  <span className="text-xs sm:text-sm font-medium">{option.text}</span>
                </div>

                {selectedOption && (
                  <span className="font-display font-black text-xs sm:text-sm text-emerald-400 shrink-0">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer text */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>
          {selectedOption
            ? '✓ Seu voto foi computado! Obrigado por participar.'
            : 'Clique em uma das opções acima para votar.'}
        </span>
        <span className="text-slate-500">Atualizado em tempo real</span>
      </div>
    </div>
  );
};
