import React, { useState, useEffect } from 'react';
import { getStudents, getPlans, toggleStudentStatus, renewStudent } from '../services/api';
import { Student, Plan } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { Search, UserX, UserCheck, Clock, Calendar, List, LayoutGrid, Users as UsersIcon, RefreshCcw, X, Check, CheckCircle, CreditCard, AlertTriangle, Phone, User, Info, DollarSign } from 'lucide-react';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'byTime'>('list');

  // Renewal Modal State
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedStudentForRenewal, setSelectedStudentForRenewal] = useState<Student | null>(null);
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [loadingRenewal, setLoadingRenewal] = useState(false);

  // Status Toggle Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);

  // View Details Modal State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  // Success Notification State
  const [successDetails, setSuccessDetails] = useState<{ name: string, newDate: string, value: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await getStudents();
    const p = await getPlans();
    setStudents(s);
    setPlans(p);
  };

  const openStatusModal = (student: Student) => {
    setStudentToToggle(student);
    setStatusModalOpen(true);
  };

  const openStudentDetails = (student: Student) => {
    setViewStudent(student);
  };

  const confirmStatusChange = async () => {
    if (!studentToToggle) return;

    const isActive = studentToToggle.status === 'Active';
    const newStatus = isActive ? 'Inactive' : 'Active';

    try {
      await toggleStudentStatus(studentToToggle.id, newStatus);
      setStatusModalOpen(false);
      setStudentToToggle(null);
      // If viewing details of this student, update the view as well
      if (viewStudent && viewStudent.id === studentToToggle.id) {
        setViewStudent({ ...viewStudent, status: newStatus });
      }
      loadData();
    } catch (error) {
      alert('Erro ao atualizar status.');
    }
  };

  const openRenewalModal = (student: Student) => {
    setSelectedStudentForRenewal(student);
    setRenewalDate(new Date().toISOString().split('T')[0]);
    setRenewalPaymentMethod(PAYMENT_METHODS[0]);
    setRenewalModalOpen(true);
  };

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForRenewal) return;

    setLoadingRenewal(true);
    try {
      await renewStudent(selectedStudentForRenewal.id, renewalDate, renewalPaymentMethod);

      // Calculate details for success modal
      const plan = plans.find(p => p.id === selectedStudentForRenewal.planId);
      const duration = plan ? plan.durationDays : 30;
      const planValue = plan ? plan.value : 0;

      const dateObj = new Date(renewalDate);
      dateObj.setDate(dateObj.getDate() + duration);
      const formattedDate = dateObj.toLocaleDateString('pt-BR');

      // Set success details to show the modal
      setSuccessDetails({
        name: selectedStudentForRenewal.name,
        newDate: formattedDate,
        value: planValue.toFixed(2).replace('.', ',')
      });

      setRenewalModalOpen(false);
      setSelectedStudentForRenewal(null);
      loadData();
    } catch (error) {
      alert('Erro ao renovar matrícula.');
    } finally {
      setLoadingRenewal(false);
    }
  };

  const getPlanName = (planId: string) => plans.find(p => p.id === planId)?.name || 'N/A';
  const getPlanValue = (planId: string) => plans.find(p => p.id === planId)?.value || 0;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  // Filter logic for List View
  const filteredStudents = students.filter(student => {
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Time Slots logic for Time View (05:00 - 21:00)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 5;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getStudentsByTime = (time: string) => {
    return students
      .filter(s => s.trainingTime === time && s.status === 'Active')
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${finalPhone}`;
  };

  return (
    <div className="space-y-6 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Alunos</h1>
          <p className="text-gray-500 text-sm">Gerencie matriculas e frequências</p>
        </div>

        {/* View Switcher */}
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all flex items-center space-x-2 text-sm font-medium ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={18} />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setViewMode('byTime')}
            className={`p-2 rounded-md transition-all flex items-center space-x-2 text-sm font-medium ${viewMode === 'byTime' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={18} />
            <span>Por Horário</span>
          </button>
        </div>
      </header>

      {viewMode === 'list' ? (
        <>
          {/* Filters for List Mode */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto">
              {(['All', 'Active', 'Inactive'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 md:flex-none ${filterStatus === status
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {status === 'All' ? 'Todos' : status === 'Active' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Aluno</th>
                    <th className="px-6 py-3">Plano</th>
                    <th className="px-6 py-3">Horário</th>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openStudentDetails(student)}
                            className="text-left group"
                          >
                            <div className="font-medium text-blue-600 group-hover:text-blue-800 group-hover:underline transition-colors">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.whatsapp}</div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {getPlanName(student.planId)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            <Clock size={14} className="mr-1.5" />
                            {student.trainingTime || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar size={14} className="mr-1.5" />
                            {formatDate(student.nextDueDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openStatusModal(student)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 border ${student.status === 'Active'
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                              }`}
                            title={`Clique para ${student.status === 'Active' ? 'Desativar' : 'Ativar'}`}
                          >
                            {student.status === 'Active' ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openRenewalModal(student)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Renovar Matrícula"
                            >
                              <RefreshCcw size={18} />
                            </button>
                            <button
                              onClick={() => openStatusModal(student)}
                              className={`p-2 rounded-lg transition-colors ${student.status === 'Active'
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-green-500 hover:bg-green-50'
                                }`}
                              title={student.status === 'Active' ? 'Desativar' : 'Ativar'}
                            >
                              {student.status === 'Active' ? <UserX size={18} /> : <UserCheck size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Time View Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in">
          {timeSlots.map(time => {
            const studentsAtTime = getStudentsByTime(time);
            const count = studentsAtTime.length;

            return (
              <div key={time} className={`rounded-xl border p-4 transition-colors ${count > 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2 text-gray-800">
                    <Clock size={18} className="text-blue-600" />
                    <span className="font-bold text-lg">{time}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                    {count} Aluno{count !== 1 && 's'}
                  </span>
                </div>

                <div className="space-y-2">
                  {count === 0 ? (
                    <p className="text-xs text-gray-400 italic">Horário vago</p>
                  ) : (
                    studentsAtTime.map(s => (
                      <div key={s.id} className="group flex items-center justify-between text-sm text-gray-700 p-1.5 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <div className="bg-gray-200 p-1 rounded-full shrink-0">
                            <UsersIcon size={12} className="text-gray-500" />
                          </div>
                          <span
                            onClick={() => openStudentDetails(s)}
                            className="truncate cursor-pointer hover:text-blue-600 hover:underline"
                          >
                            {s.name}
                          </span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenewalModal(s);
                            }}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Renovar"
                          >
                            <RefreshCcw size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openStatusModal(s);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Desativar"
                          >
                            <UserX size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renewal Input Modal */}
      {renewalModalOpen && selectedStudentForRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <RefreshCcw size={18} className="text-blue-600" />
                Renovar Matrícula
              </h3>
              <button onClick={() => setRenewalModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmRenewal} className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                <p>Aluno: <strong>{selectedStudentForRenewal.name}</strong></p>
                <p>Plano Atual: <strong>{getPlanName(selectedStudentForRenewal.planId)}</strong></p>
                <p>Valor: <strong>R$ {getPlanValue(selectedStudentForRenewal.planId).toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={renewalDate}
                    onChange={e => setRenewalDate(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  O sistema calculará o próximo vencimento a partir desta data, adicionando a duração do plano. O status será atualizado para <strong>Ativo</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={renewalPaymentMethod}
                    onChange={e => setRenewalPaymentMethod(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
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
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-in zoom-in spin-in-12 duration-500">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Renovação Concluída!</h3>

            <div className="space-y-4 mb-6">
              <p className="text-gray-500">
                A matrícula de <strong className="text-gray-800">{successDetails.name}</strong> foi renovada com sucesso.
              </p>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 text-sm text-left">
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

      {/* Status Toggle Confirmation Modal */}
      {statusModalOpen && studentToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${studentToToggle.status === 'Active' ? 'bg-red-100' : 'bg-green-100'}`}>
                {studentToToggle.status === 'Active' ? (
                  <UserX className="h-8 w-8 text-red-600" />
                ) : (
                  <UserCheck className="h-8 w-8 text-green-600" />
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {studentToToggle.status === 'Active' ? 'Desativar Aluno?' : 'Ativar Aluno?'}
              </h3>

              <p className="text-gray-500 text-sm mb-6">
                {studentToToggle.status === 'Active'
                  ? `O aluno ${studentToToggle.name} será marcado como inativo e não aparecerá na lista de frequência.`
                  : `O aluno ${studentToToggle.name} será reativado e poderá acessar a academia novamente.`
                }
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmStatusChange}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-md ${studentToToggle.status === 'Active'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                    : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                    }`}
                >
                  {studentToToggle.status === 'Active' ? 'Sim, Desativar' : 'Sim, Ativar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">

            {/* Header */}
            <div className="bg-slate-900 p-6 text-white relative">
              <button
                onClick={() => setViewStudent(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-full">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewStudent.name}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${viewStudent.status === 'Active' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                    {viewStudent.status === 'Active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

              {/* Identity & Contact */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">WhatsApp</p>
                    <a
                      href={getWhatsAppLink(viewStudent.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {viewStudent.whatsapp}
                    </a>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Plan Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Plano</p>
                    <p className="text-gray-800 font-medium">{getPlanName(viewStudent.planId)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Valor</p>
                    <p className="text-gray-800 font-medium">R$ {getPlanValue(viewStudent.planId).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Training Time */}
              <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 border border-gray-100">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Horário de Treino</p>
                  <p className="text-lg font-bold text-gray-800">{viewStudent.trainingTime || 'Não definido'}</p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Dates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-gray-400" />
                    <span className="text-gray-600 text-sm">Data de Matrícula</span>
                  </div>
                  <span className="font-medium text-gray-800">{formatDate(viewStudent.enrollmentDate)}</span>
                </div>

                <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Calendar size={18} />
                    <span className="text-sm font-bold">Próximo Vencimento</span>
                  </div>
                  <span className="font-bold text-amber-800">{formatDate(viewStudent.nextDueDate)}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2">
                <button
                  onClick={() => setViewStudent(null)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;