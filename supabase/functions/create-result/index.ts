import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Answer {
  question_id: number;
  score: number;
}

interface RequestBody {
  name: string;
  email: string;
  age: number;
  answers: Answer[];
}

// Questions data structure (from src/data/questions.ts)
interface Question {
  id: number;
  text: string;
  riasec: string | null;
  gardner: string | null;
  gopc: string | null;
}

// Import questions data
const questions: Question[] = [
  { id: 1, text: "Prefiro atividades que envolvam ajudar pessoas.", riasec: "S", gardner: "Interpessoal", gopc: "AK" },
  { id: 2, text: "Tenho interesse em desenvolver projetos práticos.", riasec: "R", gardner: null, gopc: "AK" },
  { id: 3, text: "Gosto de atividades artísticas, como desenhar ou pintar.", riasec: "A", gardner: "Espacial", gopc: "AK" },
  { id: 4, text: "Tenho interesse em liderar e motivar equipes.", riasec: "S", gardner: "Interpessoal", gopc: "AK" },
  { id: 5, text: "Prefiro trabalhar com análises e pesquisas.", riasec: "E", gardner: "Lógico-Matemática", gopc: "AK" },
  { id: 6, text: "Tenho facilidade em organizar informações e processos.", riasec: "C", gardner: "Lógico-Matemática", gopc: "PC" },
  { id: 7, text: "Gosto de resolver problemas técnicos.", riasec: "R", gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 8, text: "Tenho criatividade para encontrar soluções inovadoras.", riasec: "I", gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 9, text: "Sinto-me à vontade para atuar como mediador de conflitos.", riasec: "A", gardner: "Interpessoal", gopc: "TD" },
  { id: 10, text: "Prefiro atividades que exigem pensamento crítico.", riasec: "S", gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 11, text: "Tenho interesse por estratégias de vendas e negociação.", riasec: null, gardner: "Interpessoal", gopc: "TD" },
  { id: 12, text: "Gosto de trabalhar seguindo regras claras.", riasec: null, gardner: "Lógico-Matemática", gopc: "PC" },
  { id: 13, text: "Tenho habilidade para construir ou reparar coisas.", riasec: null, gardner: "Corporal-Cinestésica", gopc: "TD" },
  { id: 14, text: "Gosto de me expressar através de atividades criativas.", riasec: null, gardner: null, gopc: "AK" },
  { id: 15, text: "Tenho interesse em relações humanas e desenvolvimento social.", riasec: null, gardner: "Interpessoal", gopc: "AK" },
  { id: 16, text: "Prefiro estudar teorias e conceitos abstratos.", riasec: null, gardner: "Lógico-Matemática", gopc: "AK" },
  { id: 17, text: "Gosto de planejar estratégias para alcançar objetivos.", riasec: null, gardner: "Lógico-Matemática", gopc: "PC" },
  { id: 18, text: "Tenho interesse em gestão de processos e operações.", riasec: null, gardner: "Lógico-Matemática", gopc: "PC" },
  { id: 19, text: "Prefiro atividades ao ar livre e de exploração.", riasec: null, gardner: "Naturalista", gopc: "AK" },
  { id: 20, text: "Tenho boa capacidade de observância e análise.", riasec: null, gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 21, text: "Consigo manter a calma sob pressão.", riasec: null, gardner: "Intrapessoal", gopc: "TD" },
  { id: 22, text: "Tenho facilidade para lidar com conflitos.", riasec: "I", gardner: "Interpessoal", gopc: "TD" },
  { id: 23, text: "Costumo ser persistente diante de dificuldades.", riasec: null, gardner: "Intrapessoal", gopc: "AK" },
  { id: 24, text: "Preocupo-me em melhorar continuamente minhas competências.", riasec: null, gardner: "Intrapessoal", gopc: "PC" },
  { id: 25, text: "Busco feedbacks para melhorar meu desempenho.", riasec: null, gardner: "Interpessoal", gopc: "PC" },
  { id: 26, text: "Tenho facilidade para estabelecer prioridades.", riasec: null, gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 27, text: "Gosto de me desafiar para sair da zona de conforto.", riasec: null, gardner: "Intrapessoal", gopc: "AK" },
  { id: 28, text: "Tenho disciplina para atingir meus objetivos.", riasec: null, gardner: "Intrapessoal", gopc: "PC" },
  { id: 29, text: "Gosto de resolver quebra-cabeças e problemas lógicos.", riasec: null, gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 30, text: "Prefiro atividades que envolvam movimento e coordenação motora.", riasec: null, gardner: "Corporal-Cinestésica", gopc: "AK" },
  { id: 31, text: "Tenho facilidade para expressar ideias de forma oral ou escrita.", riasec: "I", gardner: "Linguística", gopc: "AK" },
  { id: 32, text: "Tenho interesse em números, padrões e relações matemáticas.", riasec: null, gardner: "Lógico-Matemática", gopc: "AK" },
  { id: 33, text: "Tenho boa percepção espacial e visual.", riasec: null, gardner: "Espacial", gopc: "AK" },
  { id: 34, text: "Costumo entender os sentimentos e motivações das pessoas.", riasec: "C", gardner: "Interpessoal", gopc: "AK" },
  { id: 35, text: "Sou introspectivo e reflito sobre minhas emoções.", riasec: null, gardner: "Intrapessoal", gopc: "AK" },
  { id: 36, text: "Tenho interesse em ciências naturais e ecologia.", riasec: "C", gardner: "Naturalista", gopc: "AK" },
  { id: 37, text: "Gosto de cantar, tocar instrumentos ou compor músicas.", riasec: "A", gardner: "Musical", gopc: "AK" },
  { id: 38, text: "Tenho boa coordenação física para atividades esportivas.", riasec: null, gardner: "Corporal-Cinestésica", gopc: "AK" },
  { id: 39, text: "Sinto facilidade em aprender novos idiomas.", riasec: "R", gardner: "Linguística", gopc: "AK" },
  { id: 40, text: "Costumo resolver problemas de forma criativa.", riasec: null, gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 41, text: "Tenho sensibilidade para identificar detalhes visuais.", riasec: "R", gardner: "Espacial", gopc: "AK" },
  { id: 42, text: "Entendo facilmente a lógica por trás de sistemas e processos.", riasec: "I", gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 43, text: "Gosto de trabalhar com animais ou plantas.", riasec: null, gardner: "Naturalista", gopc: "AK" },
  { id: 44, text: "Tenho boa noção de ritmo e melodia.", riasec: "I", gardner: "Musical", gopc: "AK" },
  { id: 45, text: "Tenho facilidade para planejar rotas e orientação espacial.", riasec: null, gardner: "Espacial", gopc: "AK" },
  { id: 46, text: "Busco entender meus sentimentos profundamente.", riasec: "A", gardner: "Intrapessoal", gopc: "AK" },
  { id: 47, text: "Gosto de ensinar ou explicar coisas para outras pessoas.", riasec: "E", gardner: "Interpessoal", gopc: "AK" },
  { id: 48, text: "Tenho curiosidade sobre fenômenos naturais.", riasec: null, gardner: "Naturalista", gopc: "AK" },
  { id: 49, text: "Tenho interesse em estudar a origem da vida e do universo.", riasec: "C", gardner: "Existencial", gopc: "AK" },
  { id: 50, text: "Tenho curiosidade sobre espiritualidade e propósito de vida.", riasec: null, gardner: "Existencial", gopc: "AK" },
  { id: 51, text: "Gosto de participar de discussões filosóficas.", riasec: "E", gardner: "Linguística", gopc: "AK" },
  { id: 52, text: "Tenho habilidade para representar ideias graficamente.", riasec: "R", gardner: "Espacial", gopc: "AK" },
  { id: 53, text: "Tenho facilidade para observar padrões em situações complexas.", riasec: "S", gardner: "Lógico-Matemática", gopc: "TD" },
  { id: 54, text: "Tenho interesse em encontrar soluções éticas para dilemas.", riasec: null, gardner: "Existencial", gopc: "TD" },
  { id: 55, text: "Gosto de escrever poesias, músicas ou histórias.", riasec: null, gardner: "Linguística", gopc: "AK" },
  { id: 56, text: "Busco entender minha identidade e propósito pessoal.", riasec: null, gardner: "Intrapessoal", gopc: "AK" },
  { id: 57, text: "Tenho interesse por arquitetura e design.", riasec: null, gardner: "Espacial", gopc: "AK" },
  { id: 58, text: "Tenho empatia por seres vivos e o meio ambiente.", riasec: null, gardner: "Naturalista", gopc: "AK" },
  { id: 59, text: "Gosto de refletir sobre questões existenciais profundas.", riasec: null, gardner: "Existencial", gopc: "AK" },
  { id: 60, text: "Tenho facilidade para definir metas pessoais e profissionais.", riasec: "C", gardner: "Intrapessoal", gopc: "PC" },
];

// Calculate scores from answers
function calculateScores(answers: Answer[]): {
  riasec_scores: Record<string, number>;
  gardner_scores: Record<string, number>;
  gopc_scores: Record<string, number>;
} {
  const riasec_scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const gardner_scores: Record<string, number> = {};
  const gopc_scores: Record<string, number> = { AK: 0, PC: 0, TD: 0 };

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.question_id);
    if (!question) continue;

    // Calculate RIASEC scores
    if (question.riasec) {
      riasec_scores[question.riasec] = (riasec_scores[question.riasec] || 0) + answer.score;
    }

    // Calculate Gardner scores
    if (question.gardner) {
      gardner_scores[question.gardner] = (gardner_scores[question.gardner] || 0) + answer.score;
    }

    // Calculate GOPC scores
    if (question.gopc) {
      gopc_scores[question.gopc] = (gopc_scores[question.gopc] || 0) + answer.score;
    }
  }

  return { riasec_scores, gardner_scores, gopc_scores };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: RequestBody = await req.json();
    const { name, email, age, answers } = body;

    console.log('Creating result for:', { name, email, age, answerCount: answers.length });

    // Validate input
    if (!name || !email || !age || !answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, age, answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (answers.length !== 60) {
      return new Response(
        JSON.stringify({ error: 'Expected 60 answers, received ' + answers.length }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate scores
    const { riasec_scores, gardner_scores, gopc_scores } = calculateScores(answers);

    console.log('Calculated scores:', { riasec_scores, gardner_scores, gopc_scores });

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert test result
    const { data: result, error: resultError } = await supabaseClient
      .from('test_results')
      .insert({
        session_id: sessionId,
        name,
        email,
        age,
        riasec_scores,
        gardner_scores,
        gopc_scores,
        is_unlocked: false,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, session_id, expires_at')
      .single();

    if (resultError) {
      console.error('Error inserting test result:', resultError);
      return new Response(
        JSON.stringify({ error: 'Failed to save test result', details: resultError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Test result created:', result);

    // Insert all individual responses
    const responses = answers.map(answer => ({
      session_id: sessionId,
      test_type: 'riasec' as const, // Using 'riasec' as default type for now
      question_id: answer.question_id.toString(),
      response: answer.score,
    }));

    const { error: responsesError } = await supabaseClient
      .from('test_responses')
      .insert(responses);

    if (responsesError) {
      console.error('Error inserting test responses:', responsesError);
      // Don't fail the request if responses fail, but log it
      console.warn('Responses not saved, but result was created successfully');
    }

    console.log('Test responses saved:', responses.length);

    return new Response(
      JSON.stringify({
        result_id: result.id,
        session_id: result.session_id,
        expires_at: result.expires_at,
        message: 'Test result created successfully',
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-result function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
