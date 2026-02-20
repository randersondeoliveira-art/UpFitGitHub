import React, { useEffect, useState } from 'react';
import { KPI, Student, Plan } from '../types';
import { getDashboardData, getPlans, renewStudent } from '../services/api';
import { Users, AlertTriangle, TrendingUp, MessageCircle, Wallet, CalendarClock, RefreshCcw, X, CreditCard, Check, CheckCircle, Calendar } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ kpi: KPI, dueStudents: Student[] } | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Renewal Modal State
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedStudentForRenewal, setSelectedStudentForRenewal] = useState<Student | null>(null);
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewalCompetenceDate, setRenewalCompetenceDate] = useState('');
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [renewalPlanId, setRenewalPlanId] = useState('');
  const [loadingRenewal, setLoadingRenewal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ name: string, newDate: string, value: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const dashboardData = await getDashboardData();
    const plansData = await getPlans();
    setData(dashboardData);
    setPlans(plansData);
    setLoading(false);
  };

  const getPlanValue = (planId: string) => plans.find(p => p.id === planId)?.value || 0;

  const generateReferenceOptions = (baseDate: string) => {
    if (!baseDate) return [];
    const options = [];
    const base = new Date(baseDate);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      const monthName = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      options.push({ label: capitalized, value: d.toISOString().split('T')[0] });
    }
    return options;
  };

  const openRenewalModal = (student: Student) => {
    setSelectedStudentForRenewal(student);
    setRenewalDate(new Date().toISOString().split('T')[0]);
    setRenewalCompetenceDate(student.nextDueDate);
    setRenewalPaymentMethod(PAYMENT_METHODS[0]);
    setRenewalPlanId(student.planId);
    setRenewalModalOpen(true);
  };

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForRenewal) return;

    setLoadingRenewal(true);
    try {
      await renewStudent(selectedStudentForRenewal.id, renewalDate, renewalPaymentMethod, renewalPlanId, renewalCompetenceDate);

      // Calculate details for success modal
      const plan = plans.find(p => p.id === renewalPlanId);
      const duration = plan ? plan.durationDays : 30;
      const planValue = plan ? plan.value : 0;

      const dateObj = new Date(renewalCompetenceDate || renewalDate);
      dateObj.setDate(dateObj.getDate() + duration);
      const formattedDate = dateObj.toLocaleDateString('pt-BR');

      setSuccessDetails({
        name: selectedStudentForRenewal.name,
        newDate: formattedDate,
        value: planValue.toFixed(2).replace('.', ',')
      });

      setRenewalModalOpen(false);
      setSelectedStudentForRenewal(null);
      loadData(); // Refresh dashboard data
    } catch (error) {
      alert('Erro ao renovar matrícula.');
    } finally {
      setLoadingRenewal(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Calculate days remaining or overdue
  const getStatusDetails = (dueDateStr: string) => {
    // Create dates at midnight to avoid timezone issues with simple string comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse ISO string YYYY-MM-DD correctly
    const [year, month, day] = dueDateStr.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Vencido há ${Math.abs(diffDays)} dias`,
        color: 'text-red-600',
        bg: 'bg-red-50',
        messagePrefix: `seu plano venceu no dia ${due.toLocaleDateString('pt-BR')}`
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Vence Hoje',
        color: 'text-red-600',
        bg: 'bg-red-50',
        messagePrefix: 'seu plano vence hoje'
      };
    }
    return {
      label: `Vence em ${diffDays} dias`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      messagePrefix: `lembrete: seu plano vence em ${diffDays} dias (${due.toLocaleDateString('pt-BR')})`
    };
  };

  const getWhatsAppLink = (student: Student) => {
    const phone = student.whatsapp.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const status = getStatusDetails(student.nextDueDate);

    const message = `Olá ${student.name}, ${status.messagePrefix}. Vamos garantir sua renovação para continuar treinando sem pausas?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-400 animate-pulse">Carregando dados...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Visão Geral</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Acompanhe o desempenho da sua academia</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Alunos Ativos"
          value={data.kpi.activeStudents.toString()}
          icon={<Users className="text-blue-600" />}
          trend="Total cadastrado"
        />
        <KpiCard
          title="A Receber (Hoje)"
          value={formatCurrency(data.kpi.receivableToday)}
          icon={<Wallet className="text-amber-500" />}
          trend="Vencimentos do dia"
        />
        <KpiCard
          title="Saldo do Mês"
          value={formatCurrency(data.kpi.monthlyBalance)}
          icon={<TrendingUp className={data.kpi.monthlyBalance >= 0 ? "text-green-600" : "text-red-500"} />}
          trend="Receitas - Despesas"
          positive={data.kpi.monthlyBalance >= 0}
        />
      </div>

      {/* Radar de Cobrança */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Radar de Cobrança</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center">
              <CalendarClock size={12} className="mr-1" /> Próximos 3 dias
            </span>
            <span className="text-xs font-medium px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
              {data.dueStudents.length} Alertas
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.dueStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>Tudo em dia! Nenhum vencimento próximo ou atrasado.</p>
            </div>
          ) : (
            data.dueStudents.map(student => {
              const statusDetails = getStatusDetails(student.nextDueDate);

              return (
                <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors gap-3 sm:gap-0">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`w-2 h-10 rounded-full ${statusDetails.color.includes('red') ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200">{student.name}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusDetails.bg} ${statusDetails.color}`}>
                          {statusDetails.label}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({new Date(student.nextDueDate).toLocaleDateString('pt-BR')})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {statusDetails.label.includes('Vencido') && (
                      <button
                        onClick={() => openRenewalModal(student)}
                        className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95 w-full sm:w-auto"
                      >
                        <RefreshCcw size={16} />
                        <span>Renovar Matrícula</span>
                      </button>
                    )}
                    <a
                      href={getWhatsAppLink(student)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95 w-full sm:w-auto"
                    >
                      <MessageCircle size={16} />
                      <span>Enviar Lembrete</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Renewal Input Modal */}
      {renewalModalOpen && selectedStudentForRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <RefreshCcw size={18} className="text-blue-600 dark:text-blue-400" />
                Renovar Matrícula
              </h3>
              <button onClick={() => setRenewalModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmRenewal} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 mb-4">
                <p>Aluno: <strong>{selectedStudentForRenewal.name}</strong></p>
                <div className="mt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-blue-700/70 dark:text-blue-300/70 mb-1">Alterar Plano (Opcional)</label>
                  <select
                    value={renewalPlanId || selectedStudentForRenewal.planId}
                    onChange={e => setRenewalPlanId(e.target.value)}
                    className="w-full p-2 rounded bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.value.toFixed(2)} - {plan.durationDays} dias
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex justify-between items-center bg-blue-100/50 p-2 rounded">
                  <span>Valor da Renovação:</span>
                  <strong className="text-lg">R$ {getPlanValue(renewalPlanId || selectedStudentForRenewal.planId).toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referência (Mês/Ano)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={renewalCompetenceDate}
                    onChange={e => setRenewalCompetenceDate(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white appearance-none"
                  >
                    {selectedStudentForRenewal && generateReferenceOptions(selectedStudentForRenewal.nextDueDate).map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={renewalDate}
                    onChange={e => setRenewalDate(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  O sistema calculará o próximo vencimento a partir da data de competência (Referência), adicionando a duração do plano. O status será atualizado para <strong>Ativo</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={renewalPaymentMethod}
                    onChange={e => setRenewalPaymentMethod(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white appearance-none"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewalModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingRenewal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loadingRenewal ? 'Processando...' : <><Check size={18} /> Confirmar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 animate-in zoom-in spin-in-12 duration-500">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Renovação Concluída!</h3>

            <div className="space-y-4 mb-6">
              <p className="text-gray-500 dark:text-gray-400">
                A matrícula de <strong className="text-gray-800 dark:text-gray-200">{successDetails.name}</strong> foi renovada com sucesso.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2 text-sm text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Novo Vencimento:</span>
                  <span className="font-bold text-blue-600">{successDetails.newDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Receita Lançada:</span>
                  <span className="font-bold text-green-600">R$ {successDetails.value}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSuccessDetails(null)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              OK, Entendi
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const KpiCard = ({ title, value, icon, trend, positive }: { title: string, value: string, icon: React.ReactNode, trend: string, positive?: boolean }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-32 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity scale-150 transform translate-x-2 -translate-y-2">
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 64 })}
    </div>
    <div className="flex justify-between items-start z-10">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className={`text-2xl font-bold mt-1 ${positive === false ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</h3>
      </div>
      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
    </div>
    <div className="mt-2 z-10">
      <p className="text-xs text-gray-400">{trend}</p>
    </div>
  </div>
);

export default Dashboard;