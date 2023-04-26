import { LogoutOptions } from '@auth0/auth0-react';
import { createContext } from 'react';

const localStored = JSON.parse(localStorage.getItem("FINANCE_APP_DATA") ?? "{}");

export const AuthContext = createContext({
    user: localStored.user ?? {},
    loginWithRedirect: () => {},
    logout: (options: LogoutOptions) => localStorage.removeItem("FINANCE_APP_DATA"),
    accessToken: localStored.accessToken ?? "",
    isAuthenticated: !!(localStored.accessToken),
    error: localStored.error
});
