import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-card space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-navy-50 text-navy-600 flex items-center justify-center">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-navy-950">Página Não Encontrada (404)</h2>
        <p className="text-sm text-slate-500">
          O endereço acessado não existe ou foi removido do sistema DocsOb.
        </p>
        <div className="pt-2">
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
