/**
 * Utilitário de Agendamento Humano Natural (Anti-Bot Pattern) do CampoBR
 * 
 * Configuração Oficial: 1 publicação diária automática no horário nobre esportivo do Brasil:
 * - Edição Diária do Meio-Dia: Base 12h00 (Variação orgânica entre 11h50 e 12h10, de -10m a +10m)
 */

export type PeakSlot = 'noon' | 'morning' | 'night' | 'lunch';

export interface HumanizedScheduleResult {
  isoString: string;
  datetimeLocalValue: string;
  displayTime: string;
  displayDate: string;
  baseTime: string;
  offsetMinutes: number;
  label: string;
}

/**
 * Gera um deslocamento aleatório entre -10 e +10 minutos (exceto zero para garantir variação natural)
 */
export function getRandomHumanOffset(): number {
  const offsets = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const randomIndex = Math.floor(Math.random() * offsets.length);
  return offsets[randomIndex];
}

/**
 * Calcula o horário agendado com jitter humano natural para a edição diária das 12h00 (-10m a +10m)
 */
export function getHumanizedPeakSchedule(peak: PeakSlot = 'noon', forceOffset?: number): HumanizedScheduleResult {
  const now = new Date();
  const target = new Date();

  let baseHour = 12;
  let baseMinute = 0;
  let peakLabel = 'Edição Diária do Meio-Dia';
  let peakEmoji = '☀️';

  if (peak === 'noon' || peak === 'lunch') {
    baseHour = 12;
    baseMinute = 0;
    peakLabel = 'Edição Diária (12h00)';
    peakEmoji = '☀️';
  } else if (peak === 'morning') {
    baseHour = 8;
    baseMinute = 0;
    peakLabel = 'Edição da Manhã';
    peakEmoji = '🌅';
  } else if (peak === 'night') {
    baseHour = 20;
    baseMinute = 30;
    peakLabel = 'Edição da Noite';
    peakEmoji = '🌙';
  }

  const offset = forceOffset !== undefined ? forceOffset : getRandomHumanOffset();

  // Aplica o horário base + variação de -10 a +10 minutos (ex: 11h50 a 12h10)
  target.setHours(baseHour, baseMinute + offset, 0, 0);

  // Se o horário de hoje já passou, programa para o dia seguinte
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const formattedHour = String(target.getHours()).padStart(2, '0');
  const formattedMinute = String(target.getMinutes()).padStart(2, '0');
  const displayTime = `${formattedHour}h${formattedMinute}`;

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const datetimeLocalValue = `${year}-${month}-${day}T${formattedHour}:${formattedMinute}`;

  const isTomorrow = target.getDate() !== now.getDate();
  const displayDate = `${isTomorrow ? 'Amanhã' : 'Hoje'} às ${displayTime}`;
  const offsetSign = offset > 0 ? `+${offset}` : `${offset}`;

  return {
    isoString: target.toISOString(),
    datetimeLocalValue,
    displayTime,
    displayDate,
    baseTime: `${String(baseHour).padStart(2, '0')}h${String(baseMinute).padStart(2, '0')}`,
    offsetMinutes: offset,
    label: `${peakEmoji} ${peakLabel} às ${displayTime} (${offsetSign} min do padrão)`,
  };
}

/**
 * Encontra o próximo horário humano das 12h00
 */
export function getNextOptimalHumanSchedule(): HumanizedScheduleResult {
  return getHumanizedPeakSchedule('noon');
}
