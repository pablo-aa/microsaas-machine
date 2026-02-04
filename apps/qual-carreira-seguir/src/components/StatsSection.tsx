import { Users, Target, Star } from "lucide-react";

const StatsSection = () => {
  return (
    <section className="py-20 gradient-stats">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stat 1 */}
          <div className="text-center animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 rounded-full p-3">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">+ de 10,237</div>
            <p className="text-white/90 text-lg">Pessoas se alinharam com suas carreiras</p>
          </div>

          {/* Stat 2 */}
          <div className="text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 rounded-full p-3">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">100% Personalizado</div>
            <p className="text-white/90 text-lg">Cada teste gera recomendações únicas, de acordo com suas respostas e seu contexto.</p>
          </div>

          {/* Stat 3 */}
          <div className="text-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 rounded-full p-3">
                <Star className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
            <p className="text-white/90 text-lg">Avaliação dos usuários</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;