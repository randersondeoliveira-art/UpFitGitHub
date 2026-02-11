import React, { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES, PAYMENT_METHODS } from '../constants';
import { addTransaction, getTransactions, deleteTransaction } from '../services/api';
import { Transaction, TransactionType } from '../types';
import { PlusCircle, FileText, ArrowDownCircle, ArrowUpCircle, Filter, Wallet, TrendingUp, TrendingDown, Tag, CreditCard, Download, X, Calendar, Trash2 } from 'lucide-react';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Filter State (Display)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'month' | 'range'>('month');
  const [exportMonth, setExportMonth] = useState(selectedMonth);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Form State
  const [transactionType, setTransactionType] = useState<TransactionType>('Despesa');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [activeTab]);

  const loadTransactions = async () => {
    const txs = await getTransactions();
    setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const openNewTransaction = (type: TransactionType) => {
    setTransactionType(type);
    // Set default categories based on type
    setCategory(type === 'Despesa' ? EXPENSE_CATEGORIES[0] : REVENUE_CATEGORIES[0]);
    setValue('');
    setDescription('');
    setPaymentMethod(PAYMENT_METHODS[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setActiveTab('new');
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addTransaction({
      date,
      type: transactionType,
      category,
      value: Number(value),
      description,
      paymentMethod
    });
    setLoading(false);
    setActiveTab('list');
    loadTransactions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id);
      loadTransactions();
    }
  };

  const handleExport = () => {
    let filteredData: Transaction[] = [];

    if (exportType === 'month') {
      filteredData = transactions.filter(t => t.date.startsWith(exportMonth));
    } else {
      if (!exportStartDate || !exportEndDate) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
      }
      filteredData = transactions.filter(t => t.date >= exportStartDate && t.date <= exportEndDate);
    }

    if (filteredData.length === 0) {
      alert("Nenhuma transação encontrada para o período selecionado.");
      return;
    }

    // Sort by date ascending for the report
    filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Create CSV content
    // BOM (\uFEFF) forces Excel to read UTF-8 correctly
    const header = "Data;Tipo;Categoria;Descrição;Valor;Forma Pagamento\n";
    const rows = filteredData.map(t => {
      const formattedDate = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR');
      const formattedValue = t.value.toFixed(2).replace('.', ','); // PT-BR number format
      // Clean description to avoid CSV breaking
      const cleanDesc = t.description.replace(/;/g, ' ');

      return `${formattedDate};${t.type};${t.category};${cleanDesc};${formattedValue};${t.paymentMethod || ''}`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURI(header + rows);

    // Trigger download
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    const filename = exportType === 'month'
      ? `relatorio_${exportMonth}.csv`
      : `relatorio_${exportStartDate}_ate_${exportEndDate}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');

  // Calculations for filtered view (Dashboard List)
  const filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  const monthlyRevenue = filteredTransactions
    .filter(t => t.type === 'Receita')
    .reduce((acc, t) => acc + t.value, 0);

  const monthlyExpense = filteredTransactions
    .filter(t => t.type === 'Despesa')
    .reduce((acc, t) => acc + t.value, 0);

  const monthlyBalance = monthlyRevenue - monthlyExpense;

  return (
    <div className="space-y-6 relative">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Financeiro</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie receitas e despesas</p>
        </div>

        {activeTab === 'list' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-slate-900 transition-colors w-full sm:w-auto"
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => openNewTransaction('Receita')}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-green-700 transition-colors w-full sm:w-auto"
            >
              <ArrowUpCircle size={16} />
              <span>Nova Receita</span>
            </button>
            <button
              onClick={() => openNewTransaction('Despesa')}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-red-700 transition-colors w-full sm:w-auto"
            >
              <ArrowDownCircle size={16} />
              <span>Nova Despesa</span>
            </button>
          </div>
        )}
      </header>

      {activeTab === 'list' && (
        <>
          {/* Filters & Summary */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="text-gray-400 w-5 h-5" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Mês:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30 flex flex-col">
                <span className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp size={14} /> Receitas
                </span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(monthlyRevenue)}</span>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 flex flex-col">
                <span className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <TrendingDown size={14} /> Despesas
                </span>
                <span className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{formatCurrency(monthlyExpense)}</span>
              </div>

              <div className={`p-4 rounded-lg border flex flex-col ${monthlyBalance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30'}`}>
                <span className={`${monthlyBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} text-xs font-bold uppercase tracking-wide flex items-center gap-1`}>
                  <Wallet size={14} /> Saldo
                </span>
                <span className={`${monthlyBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'} text-2xl font-bold mt-1`}>
                  {formatCurrency(monthlyBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Categoria/Método</th>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                    <th className="px-6 py-3 text-center w-12">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <FileText className="w-8 h-8 mb-2 opacity-50" />
                          <p>Nenhuma transação encontrada neste mês.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'Receita' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                            {t.type === 'Receita' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                            <span>{t.type}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-gray-200">{t.category}</div>
                          {t.paymentMethod && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <CreditCard size={10} className="mr-1" />
                              {t.paymentMethod}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{t.description}</td>
                        <td className={`px-6 py-4 text-right font-medium ${t.type === 'Receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {t.type === 'Despesa' ? '-' : '+'} {formatCurrency(t.value)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'new' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              {transactionType === 'Receita' ? <ArrowUpCircle className="text-green-600" /> : <ArrowDownCircle className="text-red-600" />}
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Lançar {transactionType}</h2>
            </div>
            <button onClick={() => setActiveTab('list')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Cancelar</button>
          </div>

          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  {transactionType === 'Despesa' ? (
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white appearance-none">
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white appearance-none">
                      {REVENUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                <input type="number" required step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pagamento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white appearance-none">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <input type="text" required value={description} onChange={e => setDescription(e.target.value)} placeholder={transactionType === 'Despesa' ? "Ex: Conta de Luz" : "Ex: Venda para João"} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white p-3 rounded-lg font-medium transition-colors ${transactionType === 'Receita' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {loading ? 'Salvando...' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Download size={18} className="text-slate-700 dark:text-slate-300" />
                Exportar Relatório
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setExportType('month')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${exportType === 'month' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Por Mês
                </button>
                <button
                  onClick={() => setExportType('range')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${exportType === 'range' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Por Período
                </button>
              </div>

              {exportType === 'month' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o Mês</label>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Inicial</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Final</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleExport}
                className="w-full mt-4 bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                Baixar CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;