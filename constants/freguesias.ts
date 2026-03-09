export interface Concelho {
  name: string;
  freguesias: string[];
}

export const CONCELHOS: Concelho[] = [
  {
    name: 'Calheta',
    freguesias: [
      'Arco da Calheta',
      'Calheta',
      'Estreito da Calheta',
      'Fajã da Ovelha',
      'Jardim do Mar',
      'Paul do Mar',
      'Ponta do Pargo',
      'Prazeres',
    ],
  },
  {
    name: 'Câmara de Lobos',
    freguesias: [
      'Câmara de Lobos',
      'Curral das Freiras',
      'Estreito de Câmara de Lobos',
      'Jardim da Serra',
      'Quinta Grande',
    ],
  },
  {
    name: 'Funchal',
    freguesias: [
      'Imaculado Coração de Maria',
      'Monte',
      'Santa Luzia',
      'Santa Maria Maior',
      'Santo António',
      'São Gonçalo',
      'São Martinho',
      'São Pedro',
      'São Roque',
      'Sé',
    ],
  },
  {
    name: 'Machico',
    freguesias: [
      'Água de Pena',
      'Caniçal',
      'Machico',
      'Porto da Cruz',
      'Santo António da Serra',
    ],
  },
  {
    name: 'Ponta do Sol',
    freguesias: [
      'Canhas',
      'Madalena do Mar',
      'Ponta do Sol',
    ],
  },
  {
    name: 'Porto Moniz',
    freguesias: [
      'Achadas da Cruz',
      'Porto Moniz',
      'Ribeira da Janela',
      'Seixal',
    ],
  },
  {
    name: 'Porto Santo',
    freguesias: [
      'Porto Santo',
    ],
  },
  {
    name: 'Ribeira Brava',
    freguesias: [
      'Campanário',
      'Ribeira Brava',
      'Serra de Água',
      'Tabua',
    ],
  },
  {
    name: 'Santa Cruz',
    freguesias: [
      'Camacha',
      'Caniço',
      'Gaula',
      'Santa Cruz',
      'Santo António da Serra (Santa Cruz)',
    ],
  },
  {
    name: 'Santana',
    freguesias: [
      'Arco de São Jorge',
      'Faial',
      'Ilha',
      'Santana',
      'São Jorge',
      'São Roque do Faial',
    ],
  },
  {
    name: 'São Vicente',
    freguesias: [
      'Boa Ventura',
      'Ponta Delgada',
      'São Vicente',
    ],
  },
];

export function getAllFreguesias(): string[] {
  const all: string[] = [];
  CONCELHOS.forEach(c => {
    c.freguesias.forEach(f => all.push(f));
  });
  return all;
}
