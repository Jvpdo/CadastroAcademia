import axios, { type AxiosError, type InternalAxiosRequestConfig, isAxiosError } from 'axios';

// A URL base do seu backend.
const API_URL = process.env.EXPO_PUBLIC_API_URL;


if (!API_URL) {
  // Este erro ajuda a diagnosticar se o arquivo .env não foi carregado.
  throw new Error("ERRO CRÍTICO: A variável de ambiente EXPO_PUBLIC_API_URL não está definida. Verifique seu arquivo .env e reinicie o servidor do Expo.");
}

// Exportamos a constante para que outros arquivos possam usá-la
export const BASE_URL = API_URL;

const apiInstance = axios.create({
  baseURL: BASE_URL,
});

apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  login: async (email: string, senha: string) => {
    try {
        const response = await apiInstance.post('/login', { email, senha });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) { // Agora usamos a função importada corretamente
            const axiosError = error as AxiosError<any>;
            if (axiosError.response?.data?.error) {
                throw new Error(axiosError.response.data.error);
            }
        }
        throw new Error('Não foi possível conectar ao servidor. Verifique sua rede e o endereço IP.');
    }
  },

  verifyPassword: async (token: string, senha: string) => {
    try {
        const response = await apiInstance.post('/api/me/verify-password', 
          { senha },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            const axiosError = error as AxiosError<any>;
            if (axiosError.response?.data?.error) {
                throw new Error(axiosError.response.data.error);
            }
        }
        throw new Error('Não foi possível verificar a senha.');
    }
  },

    //Função Cadastrar Alunos
  cadastrarAluno: async (formData: FormData, token: string | null) => {
    if (!token) {
      throw new Error('Nenhum token de autenticação fornecido.');
    }

    try {
      const response = await fetch(`${BASE_URL}/alunos`, {
        method: 'POST',
        headers: {
          // IMPORTANTE: Removemos o 'Content-Type'. O navegador/app
          // irá configurá-lo automaticamente para multipart/form-data
          // com os limites corretos.
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // O corpo agora é o objeto FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar aluno');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na chamada da API de cadastro:', error);
      throw error;
    }
  },

  getAlunos: async (token: string | null, pagina: number, termoBusca?: string) => {

    if (!token) {
      throw new Error('Nenhum token de autenticação fornecido.');
    }

    // Usamos URLSearchParams para construir a query string de forma segura
    const params = new URLSearchParams({
        page: String(pagina),
        limit: '10', // Fixo em 10, como você pediu
    });

    if (termoBusca) {
        params.append('nome', termoBusca);
    }

    const url = `${BASE_URL}/alunos?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao buscar alunos');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na chamada da API para buscar alunos:', error);
      throw error;
    }
  },

  getHorarios: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/horarios`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar horários');
    return await response.json();
  },

addHorario: async (horarioData: { dia_semana: string; horario_inicio: string; horario_fim: string; descricao: string; tipo_aula: string; }, token: string | null) => {    
  if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/horarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(horarioData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar horário');
    }
    return await response.json();
  },

  deleteHorario: async (id: number, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/horarios/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao deletar horário');
    }
    return await response.json();
  },

updateHorario: async (id: number, horarioData: { descricao: string; horario_inicio: string; horario_fim: string; tipo_aula: string; }, token: string | null) => {
      if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/horarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(horarioData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar horário');
    }
    return await response.json();
  },

  getGradeHorarios: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/grade-horarios`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar a grade de horários');
    return await response.json();
  },

  addGradeHorario: async (horario: string, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/grade-horarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ horario }),
    });
    if (!response.ok) throw new Error('Erro ao adicionar horário à grade');
    return await response.json();
  },

  deleteGradeHorario: async (horario: string, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    // Enviamos o horário a ser deletado como parte da URL
    const response = await fetch(`${BASE_URL}/api/grade-horarios/${horario}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao remover horário da grade');
    return await response.json();
  },

  getPresencaHoje: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/presenca/hoje`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Falha ao buscar a lista de presença');
    }
    return await response.json();
  },

  // Busca os dados de apoio para os formulários (listas de faixas e grupos)
  getKataAdminData: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/kata/admin-data`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar dados do formulário de katas');
    return await response.json();
  },

  // Busca a biblioteca completa de katas para exibição
  getKataBiblioteca: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/biblioteca`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar biblioteca de katas');
    return await response.json();
  },

  // Adiciona uma nova posição/técnica
  addKataPosicao: async (posicaoData: any, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/kata/posicoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(posicaoData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao adicionar posição');
    }
    return await response.json();
  },

  updateKataPosicaoVideo: async (id: number, video_url: string, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/kata/posicoes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ video_url }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar o vídeo');
    }
    return await response.json();
  },

  // Deleta uma posição específica
  deleteKataPosicao: async (id: number, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/kata/posicoes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao deletar posição');
    }
    return await response.json();
  },

  getAlunoById: async (id: number, token: string | null) => {
    if (!token) {
      throw new Error('Não autenticado');
    }
    // A rota agora inclui o ID do aluno
    const response = await fetch(`${BASE_URL}/alunos/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar detalhes do aluno');
    }

    return await response.json();
  },

  deleteAluno: async (id: number, token: string | null) => {
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${BASE_URL}/alunos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao deletar aluno');
    }

    return await response.json();
  },

  updateAluno: async (id: number, alunoData: any, token: string | null) => {
    if (!token) {
      throw new Error('Não autenticado');
    }

    const response = await fetch(`${BASE_URL}/alunos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(alunoData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar aluno');
    }

    return await response.json();
  },

  updatePassword: async (passwordData: any, token: string | null) => {
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${BASE_URL}/api/me/alterar-senha`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao alterar a senha');
    }

    return await response.json();
  },

  // Busca os dados do próprio usuário logado
  getMeusDados: async (token: string | null) => {
    try {
        const response = await apiInstance.get('/api/meus-dados', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            const axiosError = error as AxiosError<any>;
            if (axiosError.response?.data?.error) {
                throw new Error(axiosError.response.data.error);
            }
        }
        throw new Error('Não foi possível carregar os dados do usuário.');
    }
  },

  // Atualiza os dados do próprio usuário logado
  updateMeusDados: async (data: { telefone: string }, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/me/dados`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar o perfil');
    }
    return await response.json();
  },

  // Realiza o check-in para o aluno logado
  fazerCheckin: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/checkin`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer check-in');
    }
    return await response.json();
  },

  // Busca o histórico de check-ins do aluno logado
  getMeuHistoricoCheckins: async (token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/me/checkins`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar histórico de check-ins');
    return await response.json();
  },

  updateMinhaFoto: async (formData: FormData, token: string | null) => {
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${BASE_URL}/api/me/foto`, {
      method: 'PUT',
      headers: {
        // Novamente, não definimos o 'Content-Type' para que o sistema
        // o configure corretamente como multipart/form-data.
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar a foto');
    }

    return await response.json();
  },

  // Busca o histórico de check-ins de um aluno específico com paginação
  getHistoricoAluno: async (alunoId: number, page: number, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/alunos/${alunoId}/checkins?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar histórico do aluno');
    return await response.json();
  },

  // Adiciona um check-in manualmente para um aluno
  addCheckinManual: async (alunoId: number, dataCheckin: string, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/checkins/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ aluno_id: alunoId, data_checkin: dataCheckin }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao adicionar check-in');
    }
    return await response.json();
  },

  // Deleta um check-in específico pelo ID do check-in
  deleteCheckin: async (checkinId: number, token: string | null) => {
    if (!token) throw new Error('Não autenticado');
    const response = await fetch(`${BASE_URL}/api/checkins/${checkinId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao deletar check-in');
    }
    return await response.json();
  },
};