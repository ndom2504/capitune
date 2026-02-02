import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID || '6adf6975-91f6-4cf1-8de3-a8cdaf22ab55',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID || '79f19744-dc18-4e15-b6b9-a65e89211776'}`,
    redirectUri: import.meta.env.VITE_MS_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: false,
    postLogoutRedirectUri: import.meta.env.VITE_MS_REDIRECT_URI || window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email', 'offline_access']
};
