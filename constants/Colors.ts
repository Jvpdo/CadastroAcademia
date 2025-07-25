// constants/Colors.ts

// 1. Definimos as cores da sua marca aqui
const amareloAcademia = '#FFD700'; // Um tom de amarelo dourado/forte
const pretoAcademia = '#121212';   // Um preto suave, não absoluto
const cinzaFundo = '#1C1C1E';    // Um cinza escuro para elementos de fundo
const textoPrincipal = '#FFFFFF';
const textoSecundario = '#AAAAAA';

export const Colors = {
  // O tema claro pode ser mantido como padrão ou personalizado depois
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4', // Cor de destaque padrão
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  // 2. Aplicamos as cores da marca ao tema escuro
  dark: {
    text: textoPrincipal,
    background: pretoAcademia,
    tint: amareloAcademia,      // Cor principal de destaque (botões, links, ícones ativos)
    icon: textoPrincipal,
    tabIconDefault: textoSecundario, // Cor dos ícones inativos na barra de abas
    tabIconSelected: amareloAcademia,  // Cor do ícone ativo na barra de abas
    // Você pode adicionar mais cores personalizadas se precisar
    cardBackground: cinzaFundo,
    borderColor: '#27272A',
  },
};
