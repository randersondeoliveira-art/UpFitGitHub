import React, { useState, useEffect } from 'react';
import { getPlans, savePlan, deletePlan } from '../services/api';
import { Plan } from '../types';
import { PlusCircle, Edit2, Trash2, Calendar, DollarSign, Tag } from 'lucide-react';

const Plans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [plans, setPlans] = useState<Plan[]>([]);

  // Form State
  const [id, setId] = useState<string>('');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [activeTab]);

  const loadPlans = async () => {
    const p = await getPlans();
    setPlans(p);
  };

  const handleEdit = (plan: Plan) => {
    setId(plan.id);
    setName(plan.name);
    setValue(plan.value.toString());
    setDurationDays(plan.durationDays.toString());
    setActiveTab('form');
  };

  const handleNew = () => {
    setId('');
    setName('');
    setValue('');
    setDurationDays('');
    setActiveTab('form');
  };

  const handleDelete = async (planId: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      await deletePlan(planId);
      loadPlans();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await savePlan({
      id: id || undefined,
      name,
      value: Number(value),
      durationDays: Number(durationDays)
    });

    setLoading(false);
    setActiveTab('list');
    loadPlans();
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planos & Preços</h1>
          <p className="text-gray-500 text-sm">Configure as opções de matrícula</p>
        </div>

        {activeTab === 'list' && (
          <button
            onClick={handleNew}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={16} />
            <span>Novo Plano</span>
          </button>
        )}
      </header>

      {activeTab === 'form' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-right duration-300 max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{plans.find(p => p.id === id) ? 'Editar Plano' : 'Criar Plano'}</h2>
            <button onClick={() => setActiveTab('list')} className="text-sm text-blue-600 hover:underline">Cancelar</button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Mensal, Anual..." className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input type="number" required step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração (Dias)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input type="number" required value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="Ex: 30" className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Define quando será o próximo vencimento do aluno.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-3 rounded-lg font-medium hover:bg-slate-800 transition-colors">
              {loading ? 'Salvando...' : 'Salvar Plano'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-blue-200 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.durationDays} dias de acesso</p>
                </div>
                <div className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
                  R$ {plan.value.toFixed(2)}
                </div>
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit2 size={16} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex items-center justify-center px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plans;