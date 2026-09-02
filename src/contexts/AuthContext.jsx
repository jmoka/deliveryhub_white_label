import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getMeuPlanoStatus } from '../services/restauranteService';
import { apiPath } from '../lib/apiUrl';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [planoStatus, setPlanoStatus] = useState(null)

  useEffect(() => {
    // Get initial session - Use Promise chain
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        }
        setLoading(false)
      })?.catch((error) => {
        setAuthError('Failed to get session. Please check your Supabase connection.')
        setLoading(false)
      })

    // Listen for auth changes - NEVER ASYNC callback
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
        setAuthError(null)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  // Status da assinatura do plano — só relevante pro dono, carregado 1x por
  // sessão (RestauranteGuard usa isso pra bloquear o painel se estiver vencido).
  const refreshPlanoStatus = () => {
    if (userProfile?.role !== 'restaurant_owner') return;
    getMeuPlanoStatus().then(setPlanoStatus).catch(() => {});
  };

  useEffect(() => {
    if (userProfile?.role === 'restaurant_owner') {
      getMeuPlanoStatus().then(setPlanoStatus).catch((error) => {
        if (error?.message === 'Essas credenciais não pertencem a esta loja') {
          setAuthError('Este acesso não pertence a esta loja. Faça login pelo domínio correto do seu restaurante.');
          signOut();
        }
      });
    } else {
      setPlanoStatus(null);
    }
  }, [userProfile?.role])

  const fetchUserProfile = (userId) => {
    return supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()?.then(({ data, error }) => {
        if (error) {
          setAuthError(`Failed to fetch user profile: ${error?.message}`)
          return
        }
        setUserProfile(data)
      })
  }

  // Login mediado pelo backend (não chama signInWithPassword direto) — necessário pro
  // bloqueio por tentativas erradas (ver AuthLoginService no backend): é o backend quem
  // verifica a senha e decide bloquear, então o registro de falha não pode ser burlado
  // por quem só sabe o email de outra pessoa. Sucesso devolve os tokens da sessão já
  // emitida pelo Supabase Auth, aplicados aqui via setSession — o listener
  // onAuthStateChange (acima) cuida do resto (setUser/fetchUserProfile) normalmente.
  const signIn = async (email, password) => {
    setAuthError(null)
    setLoading(true)

    try {
      const res = await fetch(apiPath('/api/auth-principal/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      const body = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};

      if (!res.ok) {
        const mensagem = body?.message ?? 'Credenciais inválidas';
        setAuthError(mensagem);
        return { success: false, error: mensagem, bloqueadoAte: body?.bloqueado_ate ?? null };
      }

      // Conta com 2FA ativo (admin/dono de restaurante) — o backend segura a sessão
      // já emitida e devolve um desafio em vez dos tokens. Só chama setSession depois
      // que o código for confirmado, via verifyTwoFactor abaixo.
      if (body?.requires2fa) {
        setLoading(false);
        return { success: false, requires2fa: true, method: body.method, challengeId: body.challenge_id };
      }

      const { error } = await supabase?.auth?.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
      if (error) {
        setAuthError(error?.message);
        return { success: false, error: error?.message };
      }

      return { success: true };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.')
        return { success: false, error: 'Connection failed' }
      }

      setAuthError('Something went wrong. Please try again.')
      return { success: false, error: 'Authentication failed' }
    } finally {
      setLoading(false)
    }
  }

  // Segundo passo do login quando signIn devolveu requires2fa — troca o código
  // (TOTP ou email) pelos tokens que o backend segurou, e só então abre a sessão.
  const verifyTwoFactor = async (challengeId, code) => {
    setAuthError(null);
    try {
      const res = await fetch(apiPath('/api/auth-principal/verify-2fa'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, code }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const mensagem = body?.message ?? 'Código inválido';
        setAuthError(mensagem);
        return { success: false, error: mensagem };
      }

      const { error } = await supabase?.auth?.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
      if (error) {
        setAuthError(error?.message);
        return { success: false, error: error?.message };
      }
      return { success: true };
    } catch {
      setAuthError('Algo deu errado. Tente novamente.');
      return { success: false, error: 'Verification failed' };
    }
  };

  const signUp = async (email, password, userData = {}) => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            name: userData?.name || email?.split('@')?.[0],
            role: userData?.role || 'customer',
            ...userData
          }
        }
      })
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }
      
      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        setAuthError('Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.')
        return { success: false, error: 'Connection failed' }
      }
      
      setAuthError('Something went wrong. Please try again.')
      return { success: false, error: 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase?.auth?.signOut()
      if (error) {
        setAuthError(error?.message)
      }
      setUser(null)
      setUserProfile(null)
      setPlanoStatus(null)
    } catch (error) {
      setAuthError('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => setAuthError(null)

  // Recarrega o perfil do banco — usado quando algo fora do fluxo normal de
  // login muda o role da conta (ex: cadastro de motoboy promove pra 'motoboy').
  const refreshUserProfile = () => {
    if (user?.id) return fetchUserProfile(user.id)
    return Promise.resolve()
  }

  const isAdmin = () => {
    return userProfile?.role === 'admin'
  }

  const isRestaurantOwner = () => {
    return userProfile?.role === 'restaurant_owner'
  }

  const isMotoboy = () => {
    return userProfile?.role === 'motoboy'
  }

  const isAuthenticated = () => {
    return !!user
  }

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    verifyTwoFactor,
    signUp,
    signOut,
    clearError,
    isAdmin,
    isRestaurantOwner,
    isMotoboy,
    isAuthenticated,
    refreshUserProfile,
    planoStatus,
    refreshPlanoStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider