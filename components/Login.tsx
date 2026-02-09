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
        <div className={`${isSignUp ? 'bg-purple-600' : 'bg-blue-600'} p-8 text-center relative overflow-hidden transition-colors duration-500`}>
          <div className={`absolute top-0 left-0 w-full h-full ${isSignUp ? 'bg-purple-500' : 'bg-blue-500'} opacity-20 transform -skew-y-12 scale-150 origin-top-left transition-colors duration-500`}></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">GymManager Pro</h1>
            <p className={`${isSignUp ? 'text-purple-100' : 'text-blue-100'} mt-2 text-sm transition-colors duration-500`}>
              {isSignUp ? 'Crie sua conta para começar' : 'Gerencie sua academia com inteligência'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 ${isSignUp ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} transition-all`}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 ${isSignUp ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} transition-all`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {isSignUp && <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${isSignUp ? 'bg-purple-900 hover:bg-purple-800' : 'bg-slate-900 hover:bg-slate-800'} text-white p-3 rounded-lg font-bold transition-all transform flex items-center justify-center space-x-2 ${loading ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02]'}`}
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
                className={`text-sm font-medium ${isSignUp ? 'text-purple-600 hover:text-purple-800' : 'text-blue-600 hover:text-blue-800'} transition-colors flex items-center justify-center mx-auto space-x-1 outline-none`}
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