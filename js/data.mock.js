window.OMNIDUO_MOCK = {
  stats: { comments: 4832, dms: 3191, leads: 842 },
  notifications: [
    { app: "IG", title: "Instagram · agora", body: "@camila.fit comentou QUERO no reel do whey" },
    { app: "DM", title: "Direct · 2 min", body: "Tabela enviada + link wa.me para Camila" },
    { app: "WA", title: "WhatsApp · 5 min", body: "@camila.fit tocou em Chamar no WhatsApp" },
    { app: "IG", title: "Instagram · 12 min", body: "@tati.muscle comentou QUERO e reservou o kit" }
  ],
  campaigns: [
    { id: "whey", thumb: "Q", title: "Sorteio whey — comenta QUERO", meta: "reel específico · 4.832 comentários", status: "ATIVA" },
    { id: "preco", thumb: "P", title: "Tabela de preços — comenta PREÇO", meta: "qualquer post · 1.204 comentários", status: "ATIVA" },
    { id: "live", thumb: "S", title: "Live de dúvidas — comenta LINK", meta: "próximo post · rascunho", status: "PAUSADA" }
  ],
  inbox: [
    { id: "camila", name: "Camila Fit", handle: "@camila.fit", time: "14:02", unread: 2, origin: "reel QUERO",
      messages: [
        { from: "@camila.fit", text: "Comentou QUERO no reel do whey" },
        { from: "Você", text: "Te mandei a tabela no privado, Camila! Quer no Zap também?", mine: true },
        { from: "@camila.fit", text: "Quero! Manda aqui" }
      ] },
    { id: "rafa", name: "Rafa Lima", handle: "@rafa.lima", time: "13:47", unread: 0, origin: "carrossel PREÇO",
      messages: [
        { from: "@rafa.lima", text: "Comentou PREÇO no carrossel" },
        { from: "Você", text: "Te mandei a tabela no privado, Rafa. Quer no Zap também?", mine: true }
      ] },
    { id: "ju", name: "Ju Costa", handle: "@ju.costa", time: "12:15", unread: 1, origin: "wa.me",
      messages: [
        { from: "@ju.costa", text: "Oi! Vim pelo Instagram, me passa o valor do kit?" }
      ] },
    { id: "tati", name: "Tati Muscle", handle: "@tati.muscle", time: "ontem", unread: 0, origin: "reel QUERO",
      messages: [
        { from: "@tati.muscle", text: "Comentou QUERO e reservou o kit" },
        { from: "Você", text: "Kit reservado, Tati! Te chamo na sexta pra fechar.", mine: true }
      ] }
  ],
  crm: {
    novo: [{ user: "@camila.fit", meta: "reel 12/09 · QUERO" }, { user: "@rafa.lima", meta: "reel 12/09 · QUERO" }],
    zap: [{ user: "@ju.costa", meta: "wa.me · 14:02" }],
    fechado: [{ user: "@tati.muscle", meta: "kit reservado" }]
  },
  agenda: [
    { when: "SEG 18h — reel sorteio", status: "Agendado" },
    { when: "QUA 12h — carrossel tabela", status: "Rascunho" },
    { when: "SEX 19h — live + LINK", status: "Na fila" }
  ]
};
