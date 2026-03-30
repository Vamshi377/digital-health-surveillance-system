import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (credentials) => {
    // Placeholder — replace with real API call
    const mockUsers = {
      reception: { id: 1, name: 'Priya Sharma', role: 'reception', email: credentials.email, avatar: 'PS' },
      nurse:     { id: 2, name: 'Anita Devi',   role: 'nurse',     email: credentials.email, avatar: 'AD' },
      lab:       { id: 3, name: 'Ravi Kumar',   role: 'lab',       email: credentials.email, avatar: 'RK' },
      doctor:    { id: 4, name: 'Dr. Mehta',    role: 'doctor',    email: credentials.email, avatar: 'DM' },
      patient:   { id: 5, name: 'Arjun Singh',  role: 'patient',   email: credentials.email, avatar: 'AS' },
      admin:     { id: 6, name: 'Suresh Nair',  role: 'admin',     email: credentials.email, avatar: 'SN' },
      dmo:       { id: 7, name: 'Dr. Patel DMO',role: 'dmo',       email: credentials.email, avatar: 'DP' },
    };
    const matched = mockUsers[credentials.role] || mockUsers.doctor;
    setUser(matched);
    return matched;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
