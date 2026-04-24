function doGet() {
  return HtmlService.createHtmlOutputFromFile('index_apuracao')
    .setTitle('Apuração de Votos');
}

function normalizarChaveApuracao_(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function mapearColunasCabecalho_(cabecalho) {
  const mapa = {};

  for (let i = 0; i < cabecalho.length; i++) {
    const chave = normalizarChaveApuracao_(cabecalho[i]);
    if (chave) {
      mapa[chave] = i;
    }
  }

  return mapa;
}

function obterResultadosApuracao() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DADOS");
  if (!aba) throw new Error("Aba DADOS não encontrada");

  const valores = aba.getDataRange().getDisplayValues();
  if (!valores || valores.length < 2) {
    return {
      atualizadoEm: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"),
      categorias: []
    };
  }

  const cabecalho = valores[0];
  const mapaCabecalho = mapearColunasCabecalho_(cabecalho);
  const catalogo = obterCatalogoCandidatos_();
  const saida = [];

  Object.keys(catalogo).forEach(function(categoria) {
    const chaveCategoria = normalizarChaveApuracao_(categoria);
    const coluna = Object.prototype.hasOwnProperty.call(mapaCabecalho, chaveCategoria)
      ? mapaCabecalho[chaveCategoria]
      : -1;

    const candidatos = catalogo[categoria] || [];
    const contagem = {};
    const mapaNomesCatalogo = {};

    candidatos.forEach(function(c) {
      contagem[c.nome] = 0;
      mapaNomesCatalogo[normalizarChaveApuracao_(c.nome)] = c;
    });

    if (coluna !== -1) {
      for (let i = 1; i < valores.length; i++) {
        const celula = String(valores[i][coluna] || "").trim();
        if (!celula) continue;

        celula
          .split("|")
          .map(function(n) { return String(n || "").replace(/\s+/g, " ").trim(); })
          .filter(function(n) { return !!n; })
          .forEach(function(nomeLido) {
            const candidatoNormalizado = mapaNomesCatalogo[normalizarChaveApuracao_(nomeLido)];

            if (candidatoNormalizado) {
              contagem[candidatoNormalizado.nome] = (contagem[candidatoNormalizado.nome] || 0) + 1;
            } else {
              contagem[nomeLido] = (contagem[nomeLido] || 0) + 1;
            }
          });
      }
    }

    const ranking = Object.keys(contagem)
      .map(function(nome) {
        const candidatoCatalogo = candidatos.find(function(c) { return c.nome === nome; });
        return {
          nome: nome,
          votos: contagem[nome] || 0,
          foto: candidatoCatalogo ? candidatoCatalogo.foto : ""
        };
      })
      .sort(function(a, b) {
        if (b.votos !== a.votos) return b.votos - a.votos;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });

    saida.push({
      categoria: categoria,
      totalVotosCategoria: ranking.reduce(function(soma, item) { return soma + item.votos; }, 0),
      titular: ranking.length ? ranking[0] : null,
      suplente: ranking.length > 1 ? ranking[1] : null,
      ranking: ranking
    });
  });

  return {
    atualizadoEm: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss"),
    categorias: saida
  };
}

function obterCatalogoCandidatos_() {
  return {
    "Literatura": [
      {nome:"Priscila Muniz de Jesus Lima", foto:"https://drive.google.com/uc?export=view&id=18JssVEA04aKC3wCX4sITE2Bul68h2LH4"},
      {nome:"Everton Everaldo Santos dos Santos", foto:"https://drive.google.com/uc?export=view&id=1NK4DRkPfru9wKAOKYE5VkX8sT7aXLrC_"},
      {nome:"Manuel Alves de Sousa Júnior", foto:"https://drive.google.com/uc?export=view&id=1WnOy1M54kguoepPo_D0eRDKeBivOyGfR"}
    ],
    "Cultura Popular": [
      {nome:"Ana Paula de Andrade Góes", foto:"https://drive.google.com/uc?export=view&id=1W-mk5dM8tcpbHTWKnSMaEOwu_lit5yuU"},
      {nome:"Lourenço Alves de Oliveira Júnior", foto:"https://drive.google.com/uc?export=view&id=1uHgcnKQbtjKuelmEHTeNuH3BDwA785Rg"},
      {nome:"Valnei Sousa Ferreira Silva", foto:"https://drive.google.com/uc?export=view&id=1hwA2KloKrzdrGUM61a9JEGYDbtMQUS71"},
      {nome:"Mayra Virginia Sesti Paz", foto:"https://drive.google.com/uc?export=view&id=1uMYpdklMUK_xxPPMSW1I8koEm3Hy7_QE"}
    ],
    "Associação comercial/industrial/agronegócio/clube de serviços": [
      {nome:"André Luís Oliveira dos Santos", foto:"https://drive.google.com/uc?export=view&id=1qc2fV6cfYNrwiCwVjeUVwxziiGAr9wBZ"},
      {nome:"Priscila Soares dos Reis", foto:"https://drive.google.com/uc?export=view&id=1OOXf8IbAZjICu9hT6la5HD56_xG9YURZ"}
    ],
    "Comunidades Tradicionais": [
      {nome:"Arão Capinan de Oliveira", foto:"https://drive.google.com/uc?export=view&id=1RijJadFR6jBkuvXd36-JCalr1lnJlKns"},
      {nome:"Cosma Maria dos Santos", foto:"https://drive.google.com/uc?export=view&id=1fb1Efu0YuEHqGpL9FJXNmJCoFko2EveG"},
      {nome:"Igor dos Santos Mascarenhas", foto:"https://drive.google.com/uc?export=view&id=1EuXYDILeSjy6NetxdsZyQ4gyUQnShFw2"},
      {nome:"Rosenildes de Souza Santos", foto:"https://drive.google.com/uc?export=view&id=107Ux0s9Xkxebe7SPv-NOwK6AdiseFTYB"}
    ],
    "Dança": [
      {nome:"Aurelina Silva de Oliveira", foto:"https://drive.google.com/uc?export=view&id=1LHblWLrNLAM1bjQxzJCuORjwVdUDeANo"},
      {nome:"Janahina dos Santos Cavalcante", foto:"https://drive.google.com/uc?export=view&id=18aNQ5JLhSyoVkODSD6wv9rVahgzfbUDP"}
    ],
    "Musica": [
      {nome:"Elaine Paranhos dos Santos", foto:"https://drive.google.com/uc?export=view&id=1jwb2E0HB1cPcRjViU9GH3CzGeFnjw0OP"},
      {nome:"Fabricio Brito Barbosa", foto:"https://drive.google.com/uc?export=view&id=1hdTMJnuaWyvIkYnlOPzTe6Q_wxXBjBUM"},
      {nome:"Isaias Sampaio dos Santos", foto:"https://drive.google.com/uc?export=view&id=1iz9RNsRJGEnMZFAfuluVDxjqQAVtQJG3"},
      {nome:"Leandro Longo Lima", foto:"https://drive.google.com/uc?export=view&id=1fUAVKcpIbcZVSalcnZ25nywc1YIXdalT"},
      {nome:"Ticiane Reis Guimarães", foto:"https://drive.google.com/uc?export=view&id=1hs3VysNNy5FkqR-SpK49DZq0D5RKS9pP"}
    ],
    "Audiovisual/Fotografia/Comunicação e Cultura digital": [
      {nome:"Isaias da Silva de Santana", foto:"https://drive.google.com/uc?export=view&id=1Xj7H0-WYi19x_ZS1LB9VfpNlWli7NYJd"},
      {nome:"João Miguel Moreira Soares", foto:"https://drive.google.com/uc?export=view&id=1zQl1og2POTSZG1hKxUFANCHLNsaDzmXr"}
    ],
    "Teatro/Circo": [
      {nome:"Lucas Pereira Lins", foto:"https://drive.google.com/uc?export=view&id=1ZRzaNn7I6TgFYC7XD1ioYsy0Cq4r_PPG"},
      {nome:"Naiara de Oliveira de Jesus", foto:"https://drive.google.com/uc?export=view&id=1aLMvx_nm3jBf3vgkKLv799li8GnO77ZH"}
    ],
    "Patrimônio Cultural": [
      {nome:"Marcio Wesley Cerqueira Nery", foto:"https://drive.google.com/uc?export=view&id=1VqqW5kJ61kbIDbP8Sni_k489vp35srn_"},
      {nome:"Soraia Rita Gama Gonçalves", foto:"https://drive.google.com/uc?export=view&id=1cXQ5G-eiaoIDaoVWfOdhA7KqOTgSyzoe"}
    ],
    "Artesanato": [
      {nome:"Leonardo Teles de Oliveira", foto:"https://drive.google.com/uc?export=view&id=1-5KqJlEmVwHliIZp7xa3dr4r5-HANiM6"}
    ],
    "Movimento Hip Hop": [
      {nome:"Riquel Tiago de Jesus", foto:"https://drive.google.com/uc?export=view&id=1hu9x76w3Jb6wDbGlQtav23oog-miWqrP"}
    ],
    "Artes Plásticas": [
      {nome:"Katia Cunha Melo Moreira dos Santos", foto:"https://drive.google.com/uc?export=view&id=1F7HGnVGonCrOYjJ73JpI9bPzUjLkl2xT"}
    ],
    "Pesquisa/identidade/memoria": [
      {nome:"Ana Lurdes Magalhães Silva", foto:"https://drive.google.com/uc?export=view&id=13Mp3klGoYafO7k21rXncbjTe13Q5UIPi"}
    ]
  };
}
