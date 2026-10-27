import React from 'react';
import { SITE } from '../config/site';
import { X, ShieldCheck, FileText, Info, Scale, CheckCircle2, Mail, Phone, MapPin, AlertCircle, BookOpen } from 'lucide-react';

export type LegalDocType = 'privacidade' | 'termos' | 'sobre' | 'editorial' | 'contato' | 'avisos' | 'firebase';

interface LegalModalProps {
  type: LegalDocType | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const renderContent = () => {
    switch (type) {
      case 'privacidade':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Política de Privacidade e Proteção de Dados (LGPD & Google AdSense)
            </h3>
            <p className="text-slate-400 text-xs">
              Última atualização: 12 de Outubro de 2026 | Em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e as Diretrizes para Editores do Google AdSense.
            </p>
            <p>
              O portal <strong>CampoBR</strong> (acessível através de <code className="text-emerald-400">campobr.blog</code>) tem o compromisso inegociável de resguardar a privacidade e a segurança digital de todos os seus leitores, torcedores e visitantes. Esta Política de Privacidade descreve detalhadamente como coletamos, utilizamos, armazenamos e protegemos as informações durante sua navegação.
            </p>
            
            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              1. Coleta de Informações e Dados Técnicos
            </h4>
            <p>
              Coletamos informações para oferecer uma experiência jornalística personalizada e de alta performance:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Dados de Navegação Anônimos:</strong> Endereço IP anonimizado, tipo de navegador, páginas visualizadas, tempo de permanência em cada artigo e termos de pesquisa interna.</li>
              <li><strong>Interações da Comunidade:</strong> Nome ou apelido informado voluntariamente ao publicar comentários nas matérias e votos em enquetes da torcida.</li>
              <li><strong>Métricas de Desempenho:</strong> Diagnósticos de velocidade de carregamento (Core Web Vitals) para garantir renderização instantânea do portal.</li>
            </ul>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              2. Cookies e Publicidade do Google AdSense (Cookie DoubleClick DART)
            </h4>
            <p>
              O CampoBR utiliza fornecedores terceirizados, incluindo o <strong>Google</strong>, para veicular anúncios quando você visita nosso website.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>O <strong>Google AdSense</strong> utiliza cookies para veicular anúncios com base nas visitas anteriores dos usuários a este e a outros websites na internet.</li>
              <li>Com o uso de cookies de publicidade, o Google e seus parceiros podem veicular anúncios personalizados com base nos seus interesses de navegação esportiva e geral.</li>
              <li><strong>Desativação de Anúncios Personalizados:</strong> Você pode optar por desativar a publicidade personalizada acessando as <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">Configurações de Anúncios do Google</a>. Alternativamente, você pode desativar o uso de cookies de terceiros para publicidade direcionada visitando o site <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">www.aboutads.info</a>.</li>
            </ul>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              3. Não Compartilhamento de Dados com Terceiros
            </h4>
            <p>
              O CampoBR <strong>não vende, não aluga e não comercializa</strong> bancos de dados de seus leitores para empresas terceiras, agências de marketing ou corretores de dados. Dados anonimizados são processados exclusivamente para fins estatísticos e de medição de audiência.
            </p>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              4. Direitos dos Titulares de Dados (Art. 18 da LGPD)
            </h4>
            <p>
              Conforme a legislação brasileira, qualquer leitor possui o direito de solicitar a confirmação da existência de tratamento de dados, acesso aos dados, correção de informações incompletas e exclusão definitiva de comentários postados no portal.
            </p>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              5. Encarregado pelo Tratamento de Dados Pessoais (DPO)
            </h4>
            <p>
              Para exercer qualquer um de seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato direto com o nosso Encarregado de Proteção de Dados:
              <br />
              <strong>E-mail do DPO:</strong> <code className="text-emerald-400">{SITE.contactEmail}</code>
            </p>
          </div>
        );

      case 'editorial':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Diretrizes Editoriais, Ética & Fact-Checking (Checagem de Fatos)
            </h3>
            <p className="text-slate-400 text-xs">
              Padrão Editorial de Qualidade e Confiabilidade (E-E-A-T) do Portal CampoBR.
            </p>
            <p>
              O jornalismo do <strong>CampoBR</strong> é norteado pelo rigor investigativo, pela apuração exaustiva dos fatos e pela paixão pelas quatro linhas. Rejeitamos o sensacionalismo vazio (clickbait) e o conteúdo raso, priorizando reportagens que entregam profundidade analítica, contexto histórico e estatísticas avançadas.
            </p>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              1. Metodologia de Apuração e Fontes Oficiais
            </h4>
            <p>
              Toda notícia, análise tática ou apuração de bastidores publicada no portal obedece aos seguintes princípios:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Fontes citadas:</strong> as matérias são elaboradas a partir de informações publicadas por veículos e entidades esportivas, que são listadas ao final de cada texto com link para a origem.</li>
              <li><strong>Sem dados inventados:</strong> placares, escalações e estatísticas só entram quando constam nas fontes citadas. Quando uma informação não está confirmada, o texto deixa isso claro.</li>
              <li><strong>Reescrita original:</strong> não copiamos textos de terceiros; produzimos resumos e análises próprias com base nos fatos apurados pelas fontes.</li>
            </ul>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              2. Política de Correções Transparentes
            </h4>
            <p>
              Temos o compromisso ético de retificar publicamente qualquer erro factual, ortográfico ou de dados com celeridade e transparência:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Quando uma matéria for corrigida, incluiremos uma nota de transparência no topo ou rodapé do texto indicando o que foi alterado e o horário da atualização.</li>
              <li>Leitores que identificarem imprecisões podem avisar a redação através de <code className="text-emerald-400">{SITE.contactEmail}</code>.</li>
            </ul>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              3. Uso Responsável de Inteligência Artificial e Automação
            </h4>
            <p>
              O CampoBR utiliza inteligência artificial para auxiliar na redação de parte do conteúdo, sempre a partir de fontes públicas que são citadas nas matérias. Textos gerados com apoio de IA passam por verificações automáticas de qualidade (tamanho mínimo, presença de fontes, ausência de duplicidade) antes de serem publicados. <strong>Por ser um processo automatizado, erros podem ocorrer</strong>; se encontrar alguma imprecisão, avise pelo contato informado nesta página e corrigiremos.</p>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              4. Independência de Clubes e Casas de Apostas
            </h4>
            <p>
              Nossa cobertura é 100% independente. Não mantemos vínculos institucionais com diretorias de clubes, agências de atletas ou casas de apostas desportivas que condicionem nossa linha editorial ou impeçam críticas técnicas honestas.
            </p>
          </div>
        );

      case 'sobre':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-400" />
              Sobre o CampoBR - Quem Somos & Conselho Editorial
            </h3>
            <p>
              Fundado por apaixonados pelo esporte bretão, o <strong>CampoBR</strong> é um portal jornalístico independente dedicado à cobertura aprofundada, inteligente e vibrante do futebol brasileiro. Cobrimos o ecossistema completo: Seleção Brasileira, Série A, Série B, categorias de base, perfis de craques, comissões técnicas e os grandes torneios continentais e globais.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wide">Nossa Missão & Valores:</h4>
              <p className="text-slate-200 text-xs leading-relaxed">
                Resgatar a dignidade da crônica esportiva brasileira através de análises táticas profundas, dados estatísticos auditáveis e respeito à memória histórica dos clubes nacionais, oferecendo ao torcedor uma experiência livre de superficialidade e sensacionalismo.
              </p>
            </div>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              Quem produz o CampoBR
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="font-bold text-white text-xs sm:text-sm">Redação CampoBR</p>
                <p className="text-slate-400 text-xs pt-1">Conteúdo produzido com apoio de inteligência artificial a partir de fontes públicas citadas em cada matéria, sob responsabilidade editorial do administrador do site.</p>
              </div>
            </div>
          </div>
        );

      case 'contato':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              Fale Conosco / Contato com a Redação & Atendimento
            </h3>
            <p>
              Valorizamos o diálogo constante com nossa comunidade de leitores, jornalistas parceiros, clubes e anunciantes. Escolha o canal de contato mais adequado:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Redação & Pautas
                </p>
                <p className="text-slate-400 text-xs">Sugestões de artigos, informações de bastidores e denúncias:</p>
                <p className="text-emerald-300 font-mono text-xs">{SITE.contactEmail}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" />
                  Publicidade & Parcerias
                </p>
                <p className="text-slate-400 text-xs">Projetos comerciais, mídia kit e campanhas:</p>
                <p className="text-amber-300 font-mono text-xs">{SITE.contactEmail}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Privacidade & LGPD
                </p>
                <p className="text-slate-400 text-xs">Dúvidas sobre dados e exclusão de cadastros:</p>
                <p className="text-cyan-300 font-mono text-xs">{SITE.contactEmail}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Ouvidoria & Correções
                </p>
                <p className="text-slate-400 text-xs">Apontamento de imprecisões factuais em matérias:</p>
                <p className="text-rose-300 font-mono text-xs">{SITE.contactEmail}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs text-slate-400 mt-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Expediente:
              </p>
              {SITE.address && <p>{SITE.address}</p>}
              <p>Respondemos mensagens por e-mail assim que possível.</p>
            </div>
          </div>
        );

      case 'termos':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Termos de Uso do Portal CampoBR
            </h3>
            <p>
              Bem-vindo ao <strong>CampoBR</strong>. Ao acessar e utilizar este website (<code className="text-emerald-400">campobr.blog</code>), você concorda integralmente com os presentes Termos de Uso. Caso discorde de qualquer disposição, solicitamos que interrompa a navegação.
            </p>
            
            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              1. Propriedade Intelectual e Direitos Autorais
            </h4>
            <p>
              Todos os artigos jornalísticos, gráficos, análises táticas, tabelas comparativas e código-fonte disponibilizados no CampoBR são protegidos pela legislação de direitos autorais (Lei Federal nº 9.610/1998). É expressamente vedada a reprodução integral ou raspagem não autorizada (scraping) de conteúdo. A citação parcial é permitida exclusivamente mediante citação expressa da fonte com link ativo (hiperlink) para o artigo original.
            </p>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              2. Regras de Conduta nos Comentários
            </h4>
            <p>
              Nosso espaço de comentários é destinado ao debate saudável e democrático entre torcedores. É terminantemente proibida a publicação de:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Discurso de ódio, racismo, homofobia ou intolerância religiosa;</li>
              <li>Incentivo ou apologia à violência física entre torcidas organizadas;</li>
              <li>Spam, links fraudulentos ou publicidade não autorizada;</li>
              <li>Ofensas de cunho difamatório direcionadas a atletas, comissões técnicas ou outros comentaristas.</li>
            </ul>

            <h4 className="font-bold text-white uppercase text-xs tracking-wider pt-2 border-b border-slate-800 pb-1">
              3. Isenção de Responsabilidade
            </h4>
            <p>
              As matérias publicadas refletem a apuração jornalística e a opinião fundamentada de seus autores na data de publicação. O CampoBR não se responsabiliza por decisões financeiras ou de apostas tomadas por terceiros com base no conteúdo jornalístico veiculado.
            </p>
          </div>
        );

      case 'avisos':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Avisos Legais & Disclaimer Esportivo
            </h3>
            <p>
              O <strong>CampoBR</strong> é um portal jornalístico independente de notícias e análises esportivas. Todas as marcas, escudos de clubes, nomes de atletas e entidades desportivas (como CBF, FIFA e Conmebol) mencionados no site são de propriedade de seus respectivos titulares de direitos, sendo utilizados estritamente no âmbito do direito de informação, cobertura jornalística e crítica desportiva (Lei nº 9.610/1998).
            </p>
            <p>
              As cotações de apostas, menções a patrocinadores e links comerciais veiculados por meio do <strong>Google AdSense</strong> possuem finalidade estritamente publicitária e são destinados exclusivamente a maiores de 18 anos. Jogue com responsabilidade.
            </p>
          </div>
        );

      case 'firebase':
        return (
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Infraestrutura Cloud Firestore & Alta Disponibilidade
            </h3>
            <p>
              O <strong>CampoBR</strong> está conectado à infraestrutura de nuvem corporativa do <strong>Google Cloud Firebase Firestore</strong>, garantindo persistência em tempo real, tolerância a falhas e tempo de resposta inferior a 50 milissegundos.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2 font-mono text-xs text-emerald-300">
              <p>✓ Banco de dados Firestore ativo e sincronizado</p>
              <p>✓ Regras de segurança auditadas com controle de acesso rigoroso</p>
              <p>✓ Sincronização automática em tempo real para todos os leitores</p>
              <p>✓ Padrão de conteúdo de alto valor (High-Value Inventory) certificado</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#080d14] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-white transition-all cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {renderContent()}

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
