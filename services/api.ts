import { supabase } from './supabase';
import { Plan, Student, Transaction, KPI, StudentStatus } from '../types';

// --- AUTHENTICATION ---
export const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
};

// --- PLANS ---
export const getPlans = async (): Promise<Plan[]> => {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('value', { ascending: true });

    if (error) throw error;

    // Transform snake_case to camelCase
    return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        value: p.value,
        durationDays: p.duration_days
    }));
};

export const savePlan = async (plan: Omit<Plan, 'id'> & { id?: string }): Promise<void> => {
    const planData = {
        name: plan.name,
        value: plan.value,
        duration_days: plan.durationDays
    };

    if (plan.id) {
        const { error } = await supabase
            .from('plans')
            .update(planData)
            .eq('id', plan.id);
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('plans')
            .insert([planData]);
        if (error) throw error;
    }
};

export const deletePlan = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- STUDENTS ---
export const getStudents = async (): Promise<Student[]> => {
    const { data, error } = await supabase
        .from('students')
        .select('*');

    if (error) throw error;

    return data.map((s: any) => ({
        id: s.id,
        name: s.name,
        whatsapp: s.whatsapp,
        planId: s.plan_id,
        enrollmentDate: s.enrollment_date,
        nextDueDate: s.next_due_date,
        status: s.status as StudentStatus,
        trainingTime: s.training_time
    }));
};

export const saveStudent = async (studentData: Omit<Student, 'id' | 'enrollmentDate' | 'nextDueDate' | 'status'> & { paymentMethod: string; paymentDate: string }): Promise<void> => {
    const plans = await getPlans();
    const selectedPlan = plans.find(p => p.id === studentData.planId);

    if (!selectedPlan) throw new Error("Plano inválido");

    const enrollmentDate = studentData.paymentDate;

    const payDateObj = new Date(enrollmentDate);
    const nextDueObj = new Date(payDateObj);
    nextDueObj.setDate(nextDueObj.getDate() + selectedPlan.durationDays);

    const nextDueDate = nextDueObj.toISOString().split('T')[0];

    const studentInsertData = {
        name: studentData.name,
        whatsapp: studentData.whatsapp,
        plan_id: studentData.planId,
        enrollment_date: enrollmentDate,
        next_due_date: nextDueDate,
        status: 'Active',
        training_time: studentData.trainingTime
    };

    // Insert Student
    const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert([studentInsertData])
        .select()
        .single();

    if (studentError) throw studentError;

    // Add Revenue Transaction
    const description = `Matrícula: ${studentData.name} (${selectedPlan.name})`;

    await addTransaction({
        date: enrollmentDate,
        type: 'Receita',
        category: 'Mensalidade',
        value: selectedPlan.value,
        description,
        studentId: newStudent.id,
        paymentMethod: studentData.paymentMethod,
        competenceDate: enrollmentDate // For new students, competence date is enrollment date
    });
};

export const renewStudent = async (studentId: string, paymentDate: string, paymentMethod: string, newPlanId?: string, competenceDate?: string): Promise<void> => {
    // Get student
    const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

    if (fetchError) throw fetchError;

    // Determine which plan to use (new one or current one)
    const planIdToUse = newPlanId || student.plan_id;

    const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planIdToUse)
        .single();

    if (planError) throw new Error("Plano não encontrado");

    // Calculate new due date based on competenceDate, falling back to paymentDate
    const baseDate = competenceDate || paymentDate;
    const payDateObj = new Date(baseDate);
    const newDueDateObj = new Date(payDateObj);
    newDueDateObj.setDate(newDueDateObj.getDate() + plan.duration_days);

    // Update Student
    const updateData: any = {
        status: 'Active',
        next_due_date: newDueDateObj.toISOString().split('T')[0]
    };

    // Only update plan_id if it changed
    if (newPlanId && newPlanId !== student.plan_id) {
        updateData.plan_id = newPlanId;
    }

    const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId);

    if (updateError) throw updateError;

    // Create Transaction
    const description = `Renovação: ${student.name} (${plan.name})`;
    await addTransaction({
        date: paymentDate,
        type: 'Receita',
        category: 'Renovação',
        value: plan.value,
        description,
        studentId: student.id,
        paymentMethod: paymentMethod,
        competenceDate: competenceDate || paymentDate
    });
};

export const toggleStudentStatus = async (studentId: string, newStatus: StudentStatus): Promise<void> => {
    const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', studentId);

    if (error) throw error;
};

export const deleteStudent = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

export const updateStudent = async (student: Partial<Student> & { id: string }): Promise<void> => {
    const { error } = await supabase
        .from('students')
        .update({
            name: student.name,
            whatsapp: student.whatsapp,
            training_time: student.trainingTime
        })
        .eq('id', student.id);

    if (error) throw error;
};

// --- FINANCE ---
export const getTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

    if (error) throw error;

    return data.map((t: any) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        value: t.value,
        description: t.description,
        studentId: t.student_id,
        paymentMethod: t.payment_method,
        competenceDate: t.competence_date
    }));
};

export const addTransaction = async (txData: Omit<Transaction, 'id'>): Promise<void> => {
    const { error } = await supabase
        .from('transactions')
        .insert([{
            date: txData.date,
            type: txData.type,
            category: txData.category,
            value: txData.value,
            description: txData.description,
            student_id: txData.studentId,
            payment_method: txData.paymentMethod,
            competence_date: txData.competenceDate
        }]);

    if (error) throw error;
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

// --- DASHBOARD DATA ---
export const getDashboardData = async (): Promise<{ kpi: KPI, dueStudents: Student[], recentTransactions: Transaction[] }> => {
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];

    // Calculate 3 days from now for "Upcoming" radar
    const upcomingDate = new Date(todayDate);
    upcomingDate.setDate(upcomingDate.getDate() + 3);
    const upcomingLimit = upcomingDate.toISOString().split('T')[0];

    // Fetch all students and plans to calculate totals
    // Note: For large datasets this should be aggregated on DB side using RPC or Views
    const students = await getStudents();
    const plans = await getPlans();
    const transactions = await getTransactions();

    // KPI 1: Total Active Students
    const activeStudents = students.filter(s => s.status === 'Active').length;

    // KPI 2: Receivable Today
    const potentialValue = students
        .filter(s => s.nextDueDate === today && s.status === 'Active')
        .reduce((acc, s) => {
            const p = plans.find(plan => plan.id === s.planId);
            return acc + (p ? p.value : 0);
        }, 0);

    // KPI 3: Monthly Balance
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const revenue = monthlyTx.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.value, 0);
    const expenses = monthlyTx.filter(t => t.type === 'Despesa').reduce((sum, t) => sum + t.value, 0);
    const monthlyBalance = revenue - expenses;

    // Radar: Includes Overdue (date <= today) AND Upcoming (date <= today + 3 days)
    const dueStudents = students
        .filter(s => s.nextDueDate <= upcomingLimit && s.status === 'Active')
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

    return {
        kpi: {
            activeStudents,
            receivableToday: potentialValue,
            monthlyBalance
        },
        dueStudents,
        recentTransactions: transactions.slice(0, 5)
    };
};
