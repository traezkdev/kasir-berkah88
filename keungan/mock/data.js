export const mockUser = {
  id: 1,
  name: "Alfin",
  email: "alfin@example.com",
  avatar: "https://ui-avatars.com/api/?name=Alfin&background=0D8ABC&color=fff"
};

export const mockStats = {
  totalBalance: 25750000,
  monthlyIncome: 8500000,
  monthlyExpense: 3200000,
  totalDebt: 1200000,
  savingsProgress: 75 // percentage
};

export const mockTransactions = [
  { id: 1, date: "2024-03-10", type: "income", category: "Gaji", amount: 7000000, note: "Gaji Bulanan" },
  { id: 2, date: "2024-03-11", type: "expense", category: "Makan", amount: 50000, note: "Makan Siang" },
  { id: 3, date: "2024-03-12", type: "expense", category: "Transport", amount: 20000, note: "Ojek Online" },
  { id: 4, date: "2024-03-13", type: "income", category: "Bonus", amount: 1500000, note: "Bonus Projek" },
  { id: 5, date: "2024-03-14", type: "expense", category: "Belanja", amount: 350000, note: "Belanja Mingguan" },
];

export const mockDebts = [
  { id: 1, name: "Budi", amount: 500000, date: "2024-03-01", dueDate: "2024-04-01", status: "piutang", note: "Pinjam uang bensin" },
  { id: 2, name: "Bank Mandiri", amount: 1000000, date: "2024-02-15", dueDate: "2024-03-15", status: "utang", note: "Cicilan gadget" },
];

export const mockBills = [
  { id: 1, name: "Listrik PLN", amount: 250000, dueDate: "2024-03-20", status: "unpaid" },
  { id: 2, name: "Internet Biznet", amount: 400000, dueDate: "2024-03-25", status: "unpaid" },
  { id: 3, name: "Netflix", amount: 186000, dueDate: "2024-03-15", status: "paid" },
];

export const mockBudgets = [
  { id: 1, category: "Makan & Minum", limit: 3000000, used: 1200000 },
  { id: 2, category: "Transport", limit: 1000000, used: 450000 },
  { id: 3, category: "Hiburan", limit: 500000, used: 480000 },
];

export const mockSavings = [
  { id: 1, name: "Beli Laptop Baru", target: 15000000, current: 10000000 },
  { id: 2, name: "Dana Darurat", target: 20000000, current: 5000000 },
];
