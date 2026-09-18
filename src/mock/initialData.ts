import { Conversation, PromptSuggestion, UserProfile } from "../types/chat";

export const INITIAL_USER: UserProfile = {
  name: "Yuki",
  email: "yuki@nubi.ai",
  avatarText: "Y",
  plan: "Conta pessoal",
};

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: "sug-1",
    title: "Explique algo para mim",
    subtitle: "Aprenda sobre tecnologia, ciência ou física de forma clara",
    prompt: "Explique o conceito de computação quântica de forma simples e intuitiva.",
    iconName: "lightbulb",
  },
  {
    id: "sug-2",
    title: "Ajude com uma ideia",
    subtitle: "Brainstorming para projetos, novos produtos ou estratégias",
    prompt: "Quero criar um produto simples de produtividade. Pode me dar 3 ideias rascunhadas?",
    iconName: "compass",
  },
  {
    id: "sug-3",
    title: "Analise um problema",
    subtitle: "Encontre soluções estratégicas e diagnósticos práticos",
    prompt:
      "Estou tendo dificuldades de retenção de usuários no meu aplicativo web. Quais pontos analisar?",
    iconName: "code",
  },
  {
    id: "sug-4",
    title: "Escreva um texto",
    subtitle: "Rascunhos de e-mails, artigos técnicos ou mensagens",
    prompt:
      "Escreva um e-mail curto e profissional apresentando nossa nova solução para um cliente.",
    iconName: "pen",
  },
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    title: "Como funciona energia solar?",
    createdAt: "Hoje, 14:32",
    model: "3.5",
    messages: [
      {
        id: "m1-1",
        role: "user",
        content: "Como funciona a energia solar e por que ela é considerada uma energia limpa?",
        createdAt: "14:32",
      },
      {
        id: "m1-2",
        role: "assistant",
        content: `A energia solar fotovoltaica funciona convertendo a luz do Sol diretamente em eletricidade por meio do efeito fotovoltaico.

Como funciona o processo:

1. Captação: Os painéis solares absorvem a luz solar.
2. Geração: A energia liberta elétrons nas células de silício, gerando corrente contínua.
3. Inversão: O inversor converte para corrente alternada, padrão das residências.
4. Distribuição: A eletricidade alimenta os aparelhos da casa.

Por que é limpa?
Não emite gases poluentes durante a geração e utiliza um recurso abundante e renovável.`,
        createdAt: "14:32",
      },
      {
        id: "m1-3",
        role: "user",
        content: "Qual o tempo médio de retorno do investimento (payback) em uma residência?",
        createdAt: "14:35",
      },
      {
        id: "m1-4",
        role: "assistant",
        content: `O tempo médio de retorno do investimento em um sistema fotovoltaico residencial gira em torno de 3 a 5 anos.

Como os painéis possuem durabilidade superior a 25 anos, você desfrutará de mais de 20 anos de economia após o investimento inicial.`,
        createdAt: "14:35",
      },
    ],
  },
  {
    id: "conv-2",
    title: "Ideias para meu projeto",
    createdAt: "Hoje, 11:15",
    model: "Pro",
    messages: [
      {
        id: "m2-1",
        role: "user",
        content:
          "Preciso de sugestões de projetos web modernos para meu portfólio de desenvolvedor.",
        createdAt: "11:15",
      },
      {
        id: "m2-2",
        role: "assistant",
        content: `Aqui estão 3 ideias diretas para o seu portfólio:

1. Assistente de Code Review
Analisa arquivos de código e sugere otimizações e refatorações limpas.

2. Gerador de Resumos Técnicos
Converte textos longos ou notas de reuniões em tópicos práticos.

3. Ferramenta de Diagnóstico UX
Identifica problemas de contraste e acessibilidade visual em interfaces.`,
        createdAt: "11:16",
      },
    ],
  },
  {
    id: "conv-3",
    title: "Planejamento de estudos",
    createdAt: "Ontem, 19:40",
    model: "3.5",
    messages: [
      {
        id: "m3-1",
        role: "user",
        content: "Monte um cronograma de estudos de 4 semanas para aprender TypeScript avançado.",
        createdAt: "19:40",
      },
      {
        id: "m3-2",
        role: "assistant",
        content: `Plano de estudos estruturado para 4 semanas:

Semana 1: Generics avançados, inferência e Mapped Types.
Semana 2: Design Patterns essenciais em TypeScript.
Semana 3: Princípios SOLID e arquitetura modular.
Semana 4: Testes unitários e construção de uma biblioteca tipada.`,
        createdAt: "19:41",
      },
    ],
  },
  {
    id: "conv-4",
    title: "Análise de documento",
    createdAt: "Ontem, 16:05",
    model: "Ultra",
    messages: [
      {
        id: "m4-1",
        role: "user",
        content: "Quais são as seções fundamentais de uma proposta comercial de software?",
        createdAt: "16:05",
      },
      {
        id: "m4-2",
        role: "assistant",
        content: `Seções essenciais de uma proposta comercial:

1. Resumo Executivo
2. Entendimento do Desafio
3. Escopo da Solução
4. Cronograma & Entregáveis
5. Investimento e Próximos Passos`,
        createdAt: "16:06",
      },
    ],
  },
  {
    id: "conv-5",
    title: "Dúvida sobre programação",
    createdAt: "28 Ago, 10:12",
    model: "Code",
    messages: [
      {
        id: "m5-1",
        role: "user",
        content: "Como evitar re-renders desnecessários no React em listas grandes?",
        createdAt: "10:12",
      },
      {
        id: "m5-2",
        role: "assistant",
        content: `Para otimizar listas grandes no React:

1. Virtualização de Lista: Renderize apenas os itens visíveis na tela.
2. React.memo: Evite a re-renderização de itens cujas props não mudaram.
3. Callbacks Estáveis: Utilize useCallback para funções passadas como props.
4. Keys Estáveis: Sempre utilize IDs únicos em vez dos índices do array.`,
        createdAt: "10:13",
      },
    ],
  },
  {
    id: "conv-6",
    title: "Criar uma estratégia de marketing",
    createdAt: "25 Ago, 18:22",
    model: "Pro",
    messages: [
      {
        id: "m6-1",
        role: "user",
        content: "Como criar uma campanha de lançamento para uma ferramenta SaaS?",
        createdAt: "18:22",
      },
      {
        id: "m6-2",
        role: "assistant",
        content: `Fases essenciais de um lançamento:

- Pré-lançamento: Landing page simples de lista de espera e teasers.
- Lançamento: Anúncio oficial e demonstrações diretas do produto.
- Pós-lançamento: Onboarding guiado e rápida coleta de feedback.`,
        createdAt: "18:23",
      },
    ],
  },
];
