
export interface Plan {
  id: string;
  name: string;
  value: number;
  durationDays: number;
}

export type StudentStatus = 'Active' | 'Inactive' | 'Pending';

export interface Student {
  id: string;
  name: string;
  whatsapp: string;
  planId: string;
  enrollmentDate: string; // ISO Date
  nextDueDate: string; // ISO Date
  status: StudentStatus;
  trainingTime?: string;
}

export type TransactionType = 'Receita' | 'Despesa';

export interface Transaction {
  id: string;
  date: string; // ISO Date
  type: TransactionType;
  category: string;
  value: number;
  description: string;
  studentId?: string; // Optional linkage
  paymentMethod?: string;
  competenceDate?: string; // ISO Date (Referencia/Mes-Ano)
}

export interface KPI {
  activeStudents: number;
  receivableToday: number;
  monthlyBalance: number;
}

export type ViewState = 'dashboard' | 'new-student' | 'finance' | 'plans' | 'students';