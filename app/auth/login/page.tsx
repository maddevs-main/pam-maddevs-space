"use client";
import React, { useState } from 'react';
import Header from '../../../components/Header';
import InlineLoader from '../../../components/ui/InlineLoader';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import styled, { createGlobalStyle } from 'styled-components';

// --- 1. Global Styles ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #000;
    color: #111827;
  }

  * { box-sizing: border-box; }
`;

// --- 2. Styled Page Components ---
const PageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 3rem 1rem;
`;

const Container = styled.div`
  width: 100%;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
`;

const Card = styled.div`
  padding: 2rem;
  background-color: #d8c0a7ff;
  border-radius: 0.375rem;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  position: relative;
  z-index: 1;
`;

const Background = styled.div`
  background-image: url('/bg-login.jpg');
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  position: relative;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 0;
`;

const Title = styled.h2`
  margin-bottom: 2rem;
  font-size: 3.75rem;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.025em;
  text-align: left;
  color: #111827;
  text-transform: uppercase;
`;

const Form = styled.form`
  & > * + * { margin-top: 1.5rem; }
`;

const FieldWrapper = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #374151;
`;

const LabelGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ForgotPasswordButton = styled.button`
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #44403c;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  &:hover { color: #292524; }
  &:focus { outline: none; }
`;

const Notification = styled.div`
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
  border-radius: 0.375rem;
  background-color: #e5e7eb;
  color: #1f2937;
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #fff;
  background-color: #292524;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  cursor: pointer;
  transition: all 300ms cubic-bezier(0.4,0,0.2,1);
  &:hover { background-color: #1c1917; }
  &:focus { outline: none; box-shadow: 0 0 0 2px #f9fafb, 0 0 0 4px #44403c; }
`;

const FooterNote = styled.div`
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  color: #374151;
`;

const FooterLink = styled.span`
  color: #292524;
  font-weight: 600;
  margin-left: 0.25rem;
  text-decoration: none;
  cursor: pointer;
`;

// --- 3. Styled Input Components ---
const InputWrapper = styled.div` position: relative; `;
const InputIcon = styled.span` position: absolute; top: 0; bottom: 0; left: 0; display:flex; align-items:center; padding-left:0.75rem; `;
const StyledInputBase = styled.input`
  display:block; width:100%; padding-top:0.75rem; padding-bottom:0.75rem; padding-right:1rem; color:#111827; background:#f5ede6; border:1px solid #d1d5db; border-radius:0.375rem; box-shadow:0 1px 2px 0 rgb(0 0 0 /0.05); font-size:0.875rem; line-height:1.25rem;
  &::placeholder { color:#6b7280; }
  &:focus { outline:none; box-shadow:0 0 0 2px #44403c; border-color:#44403c; }
`;
const StyledIconInput = styled(StyledInputBase)` padding-left:2.5rem; `;
const StyledPasswordInput = styled(StyledInputBase)` padding-left:2.5rem; padding-right:2.5rem; `;
const PasswordToggleButton = styled.button`
  position:absolute; top:0; bottom:0; right:0; display:flex; align-items:center; padding-right:0.75rem; color:#6b7280; background:transparent; border:none; cursor:pointer; &:hover{ color:#374151 } &:focus{ outline:none }
`;

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode };
const IconInput: React.FC<InputProps> = ({ icon, ...props }) => (
  <InputWrapper>
    <InputIcon>{icon}</InputIcon>
    <StyledIconInput {...props} />
  </InputWrapper>
);

const PasswordInput: React.FC<Omit<InputProps,'icon'>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <InputWrapper>
      <InputIcon><Lock className="w-5 h-5 text-gray-400" aria-hidden="true" /></InputIcon>
      <StyledPasswordInput {...props} type={showPassword ? 'text' : 'password'} />
      <PasswordToggleButton type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword? 'Hide password':'Show password'}>
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </PasswordToggleButton>
    </InputWrapper>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(false);

  const handleForgotClick = () => {
    setShowNotification(true);
    setTimeout(()=>setShowNotification(false), 3000);
  };


  // Use NextAuth client session for redirect after sign-in, fallback to cookie polling only if session is not detected
  const { data: session, status } = useSession();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setRetry(false);
    try {
      const res: any = await signIn('credentials', { redirect: false, email, password });
      if (!res || res.error) {
        setError(res?.error === 'CredentialsSignin'
          ? 'The email or password you entered is incorrect. Please check and try again.'
          : (res?.error || 'We couldn’t log you in. Please try again.'));
        setLoading(false);
        setRetry(true);
        return;
      }

      // Credentials signIn succeeded. NextAuth may not have the session immediately
      // available to the client because cookies are set as part of the response
      // — poll `/api/auth/me` a few times to read the authoritative role and
      // only then redirect. This avoids spuriously redirecting back to login
      // during SSR checks while still keeping behavior simple.
      let userRole: string | null = null;
      const maxAttempts = 6;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const check = await fetch('/api/auth/me', { credentials: 'same-origin' });
          if (check.ok) {
            const data = await check.json();
            if (data && data.user && data.user.role) {
              userRole = data.user.role;
              break;
            }
          }
        } catch (e) {
          // ignore transient network errors
        }
        // backoff before retrying so server has time to set cookies
        // small delay: 200ms, increasing
        await new Promise((r) => setTimeout(r, 200 + attempt * 150));
      }

      let dest = '/dashboard';
      if (userRole === 'admin') dest = '/admin';
      // if role not discovered, default to /dashboard — this is safe because
      // server-side checks will validate session; user stays signed in if auth ok.
      router.replace(dest);
      return;

    } catch (err) {
      console.error(err);
      setError('Something went wrong while signing you in. Please try again.');
      setRetry(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="maddevs" />
      <GlobalStyle />
      <Background>
        <Overlay />
        <PageWrapper>
          <Container>
            <Card>
              <Title>Login</Title>
              <Form onSubmit={handleSubmit} method="post" action="/api/auth/local-login">
              <FieldWrapper>
                <Label htmlFor="email" style={{ marginBottom: '0.5rem' }}>Email Address</Label>
                <IconInput id="email" name="email" type="email" autoComplete="email" required placeholder="your.email@example.com" icon={<Mail className="w-5 h-5 text-gray-400" />} value={email} onChange={(e)=>setEmail(e.target.value)} />
              </FieldWrapper>

              <FieldWrapper>
                <LabelGroup>
                  <Label htmlFor="password">Password</Label>
                  <ForgotPasswordButton type="button" onClick={handleForgotClick}>Forgot password?</ForgotPasswordButton>
                </LabelGroup>
                <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
              </FieldWrapper>

              {showNotification && (<Notification>Please contact your administrator.</Notification>)}
              {error && (
                <Notification style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                  {error}
                  {retry && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        style={{ background: '#d8c0a7', color: '#292524', border: 'none', borderRadius: 6, padding: '0.5rem 1.25rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                        onClick={() => { setError(null); setRetry(false); setLoading(false); }}
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        style={{ background: 'transparent', color: '#786143', border: 'none', marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={() => window.location.reload()}
                      >
                        Refresh Page
                      </button>
                    </div>
                  )}
                </Notification>
              )}

              <FieldWrapper>
                <SubmitButton type="submit" disabled={loading} aria-busy={loading} aria-disabled={loading}>
                  {loading ? <InlineLoader size={18} /> : 'Sign In'}
                </SubmitButton>
              </FieldWrapper>

              <FieldWrapper>
                <FooterNote>
                  Don't have an account?
                  <Link href="/auth/register">
                    <FooterLink>Register</FooterLink>
                  </Link>
                </FooterNote>
              </FieldWrapper>
            </Form>
          </Card>
          </Container>
        </PageWrapper>
      </Background>
    </>
  );
}
