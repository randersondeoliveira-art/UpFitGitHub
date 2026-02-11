import React, { useState, useEffect } from 'react';
import { PAYMENT_METHODS } from '../constants';
import { saveStudent, updateStudent, getPlans } from '../services/api';
import { Plan, Student } from '../types';
import { Check, User, Phone, CreditCard, ChevronDown, Clock, Wallet, Calendar, AlertCircle } from 'lucide-react';

interface StudentFormProps {
  onSuccess: () => void;
  initialData?: Student | null;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSuccess, initialData }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [planId, setPlanId] = useState('');
  const [trainingTime, setTrainingTime] = useState('18:00');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const loadedPlans = await getPlans();
      setPlans(loadedPlans);
      if (loadedPlans.length > 0) {
        setPlanId(loadedPlans[0].id);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setWhatsapp(initialData.whatsapp);
      setTrainingTime(initialData.trainingTime || '18:00');
      if (initialData.planId) {
        setPlanId(initialData.planId);
      }
    }
  }, [initialData]);

  // Generate time slots from 05:00 to 21:00
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 5;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planId && !initialData) {
      alert('Por favor, selecione um plano ou cadastre um novo plano antes de continuar.');
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await updateStudent({
          id: initialData.id,
          name,
          whatsapp,
          trainingTime
        });
        alert('Dados do aluno atualizados com sucesso!');
      } else {
        await saveStudent({
          name,
          whatsapp,
          planId,
          trainingTime,
          paymentMethod,
          paymentDate
        });
        alert('Aluno cadastrado com sucesso! Receita lançada automaticamente.');
      }

      setName('');
      setWhatsapp('');
      // Reset planId to first available or empty
      const currentPlans = await getPlans();
      setPlanId(currentPlans.length > 0 ? currentPlans[0].id : '');
      setTrainingTime('18:00');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      onSuccess();
    } catch (error) {
      alert(initialData ? 'Erro ao atualizar aluno' : 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === planId);

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar Aluno' : 'Novo Aluno'}</h1>
        <p className="text-gray-500 text-sm">{initialData ? 'Atualize os dados cadastrais' : 'Cadastre um aluno e gere a cobrança automaticamente'}</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: João da Silva"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">WhatsApp (apenas números)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: 11999999999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Horário de Treino</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={trainingTime}
                  onChange={e => setTrainingTime(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-all"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {!initialData && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Plano</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={planId}
                    onChange={e => setPlanId(e.target.value)}
                    disabled={plans.length === 0}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-all disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {plans.length === 0 ? (
                      <option value="">Nenhum plano cadastrado</option>
                    ) : (
                      plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.value.toFixed(2)}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {plans.length === 0 && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle size={12} className="mr-1" />
                    Cadastre um plano na aba "Planos" primeiro.
                  </p>
                )}
              </div>
            )}
          </div>

          {!initialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-all"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPlan && !initialData && (
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-2 flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Este plano gerará uma receita de <strong>R$ {selectedPlan.value.toFixed(2)}</strong> na data <strong>{new Date(paymentDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> via <strong>{paymentMethod}</strong>.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || plans.length === 0}
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading || plans.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
          >
            {loading ? 'Salvando...' : (initialData ? 'Atualizar Aluno' : 'Cadastrar Aluno')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;