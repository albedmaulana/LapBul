import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

import axios from 'axios';

interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

// 1. Mematikan teguran ESLint khusus untuk baris ini
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
    token: null,
    login: () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // 2. Perbaikan: Mengambil token langsung saat pembuatan state (tanpa useEffect)
    const [token, setToken] = useState<string | null>(() => {
        const savedToken = localStorage.getItem('lapbul_token');
        if (savedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            return savedToken;
        }
        return null;
    });

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('lapbul_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('lapbul_token');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
