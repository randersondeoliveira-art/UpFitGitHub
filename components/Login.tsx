import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, ArrowRight, UserPlus, ArrowLeft } from 'lucide-react';
import { login, signUp } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Conta criada com sucesso! Você já pode fazer login.');
        setIsSignUp(false);
      } else {
        await login(email, password);
        onLogin();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Erro desconhecido';
      if (msg.includes('User already registered')) {
        alert('Usuário já cadastrado.');
      } else if (msg.includes('Invalid login credentials')) {
        alert('Credenciais inválidas.');
      } else {
        alert(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className={`bg-slate-900 dark:bg-black p-8 text-center relative overflow-hidden transition-colors duration-500`}>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <img src="/UP LOGO.png" alt="UP Fit Logo" className="h-12 object-contain" />
            </div>
          </div>
          <p className="text-gray-300 mt-2 text-sm font-light">
            {isSignUp ? 'Crie sua conta para começar' : 'Gerencie sua academia com inteligência'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8 bg-white dark:bg-gray-800 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-upfit-orange dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-upfit-orange dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {isSignUp && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mínimo de 6 caracteres</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-upfit-orange hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-all transform flex items-center justify-center space-x-2 ${loading ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02]'}`}
            >
              {loading ? (
                <span>Processando...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Criar Conta' : 'Acessar Painel'}</span>
                  {isSignUp ? <UserPlus size={18} /> : <ArrowRight size={18} />}
                </>
              )}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                }}
                className="text-sm font-medium text-upfit-orange hover:text-orange-600 transition-colors flex items-center justify-center mx-auto space-x-1 outline-none"
              >
                {isSignUp ? (
                  <>
                    <ArrowLeft size={14} />
                    <span>Voltar para Login</span>
                  </>
                ) : (
                  <span>Não tem conta? Cadastre-se agora</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;