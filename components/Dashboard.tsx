import React, { useEffect, useState } from 'react';
import { KPI, Student } from '../types';
import { getDashboardData } from '../services/api';
import { Users, AlertTriangle, TrendingUp, MessageCircle, Wallet, CalendarClock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ kpi: KPI, dueStudents: Student[] } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const dashboardData = await getDashboardData();
    setData(dashboardData);
    setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-gray-500 text-sm">Acompanhe o desempenho da sua academia</p>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <h2 className="font-semibold text-gray-800">Radar de Cobrança</h2>
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

        <div className="divide-y divide-gray-100">
          {data.dueStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>Tudo em dia! Nenhum vencimento próximo ou atrasado.</p>
            </div>
          ) : (
            data.dueStudents.map(student => {
              const statusDetails = getStatusDetails(student.nextDueDate);

              return (
                <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-3 sm:gap-0">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`w-2 h-10 rounded-full ${statusDetails.color.includes('red') ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, trend, positive }: { title: string, value: string, icon: React.ReactNode, trend: string, positive?: boolean }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity scale-150 transform translate-x-2 -translate-y-2">
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 64 })}
    </div>
    <div className="flex justify-between items-start z-10">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className={`text-2xl font-bold mt-1 ${positive === false ? 'text-red-600' : 'text-gray-900'}`}>{value}</h3>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
    </div>
    <div className="mt-2 z-10">
      <p className="text-xs text-gray-400">{trend}</p>
    </div>
  </div>
);

export default Dashboard;