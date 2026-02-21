import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Transaction } from '../types'
import { TEST_USER, TRANSACTIONS } from '../data/mockData'

interface AuthContextValue {
  user: User | null
  transactions: Transaction[]
  login: (email: string, password: string) => boolean
  signup: (data: SignupData) => void
  logout: () => void
  addTransaction: (t: Transaction) => void
}

export interface SignupData {
  name: string
  email: string
  password: string
  userType: User['userType']
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fw_user')
    return saved ? JSON.parse(saved) : null
  })

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fw_transactions')
    return saved ? JSON.parse(saved) : TRANSACTIONS
  })

  useEffect(() => {
    if (user) localStorage.setItem('fw_user', JSON.stringify(user))
    else localStorage.removeItem('fw_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('fw_transactions', JSON.stringify(transactions))
  }, [transactions])

  function login(email: string, _password: string): boolean {
    // Test account shortcut
    if (
      email === TEST_USER.email ||
      email === 'test@test.com' ||
      email === 'demo@demo.com'
    ) {
      setUser(TEST_USER)
      setTransactions(TRANSACTIONS)
      return true
    }
    const saved = localStorage.getItem('fw_user')
    if (saved) {
      const u: User = JSON.parse(saved)
      if (u.email === email) {
        setUser(u)
        return true
      }
    }
    return false
  }

  function signup(data: SignupData) {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      userType: data.userType,
      joinDate: new Date().toISOString().slice(0, 10),
      monthlyBudget: data.userType === 'high_school' ? 500 : data.userType === 'college' ? 2200 : 4000,
      categoryBudgets: {
        food: data.userType === 'high_school' ? 100 : data.userType === 'college' ? 400 : 600,
        going_out: data.userType === 'high_school' ? 80 : data.userType === 'college' ? 200 : 300,
        entertainment: data.userType === 'high_school' ? 60 : data.userType === 'college' ? 150 : 200,
        housing_utilities: data.userType === 'high_school' ? 0 : data.userType === 'college' ? 800 : 1500,
        academics: data.userType === 'college' ? 300 : 0,
        auto_insurance: data.userType === 'high_school' ? 80 : 120,
        stocks: data.userType === 'high_school' ? 50 : data.userType === 'college' ? 150 : 500,
        other: 80,
      },
    }
    setUser(newUser)
    setTransactions([])
  }

  function logout() {
    setUser(null)
  }

  function addTransaction(t: Transaction) {
    setTransactions((prev) => [t, ...prev])
  }

  return (
    <AuthContext.Provider value={{ user, transactions, login, signup, logout, addTransaction }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
