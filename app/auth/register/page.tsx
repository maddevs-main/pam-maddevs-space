"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Building, Ticket } from 'lucide-react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #000;
    color: #111827;
  }

  * {
    box-sizing: border-box;
  }
`;

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
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
  position: relative;
  z-index: 1;
`;

const Background = styled.div`
  background-image: url('/bg-register.jpg');
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
  & > * + * {
    margin-top: 1.5rem;
  }
`;

const FieldWrapper = styled.div``;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: #374151;
`;

const Notification = styled.div<{ $isError: boolean }>`
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
  border-radius: 0.375rem;
  background-color: ${(props) => (props.$isError ? '#fee2e2' : '#dcfce7')};
  color: ${(props) => (props.$isError ? '#991b1b' : '#166534')};
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
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;

  &:hover {
    background-color: #1c1917;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #f9fafb, 0 0 0 4px #44403c;
  }
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

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.span`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  padding-left: 0.75rem;
`;

const StyledInputBase = styled.input`
  display: block;
  width: 100%;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-right: 1rem;
  color: #111827;
  background-color: #f5ede6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  appearance: none;
  font-size: 0.875rem;
  line-height: 1.25rem;

  &::placeholder {
    color: #6b7280;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #44403c;
    border-color: #44403c;
  }
`;

const StyledIconInput = styled(StyledInputBase)`
  padding-left: 2.5rem;
`;

const StyledPasswordInput = styled(StyledInputBase)`
  padding-left: 2.5rem;
  padding-right: 2.5rem;
`;

const PasswordToggleButton = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding-right: 0.75rem;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: #374151;
  }

  &:focus {
    outline: none;
  }
`;

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
};

const IconInput: React.FC<InputProps> = ({ icon, ...props }) => {
  return (
    <InputWrapper>
      <InputIcon>{icon}</InputIcon>
      <StyledIconInput {...props} />
    </InputWrapper>
  );
};

const PasswordInput: React.FC<Omit<InputProps, 'icon'>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputWrapper>
      <InputIcon>
        <Lock className="w-5 h-5 text-gray-400" aria-hidden="true" />
      </InputIcon>
      <StyledPasswordInput
        {...props}
        type={showPassword ? 'text' : 'password'}
      />
      <PasswordToggleButton
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </PasswordToggleButton>
    </InputWrapper>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    isError: false,
  });

  const setTempNotification = (message: string, isError: boolean) => {
    setNotification({ show: true, message, isError });
    setTimeout(() => {
      setNotification({ show: false, message: '', isError: false });
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setTempNotification('Passwords do not match.', true);
      return;
    }
    if (password.length < 6) {
      setTempNotification('Password must be at least 6 characters.', true);
      return;
    }
    if (!inviteCode) {
      setTempNotification('Invite code is required.', true);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, organisation, inviteCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.token) {
        setTempNotification(data?.message || 'Registration failed', true);
        return;
      }
      // Store JWT in localStorage
      window.localStorage.setItem('pam_jwt', data.token);
      window.localStorage.setItem('pam_user', JSON.stringify(data.user));
      setTempNotification('Registration successful!', false);
      // clear fields
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setOrganisation('');
      setInviteCode('');
      // redirect to dashboard after small delay
      setTimeout(() => router.replace('/dashboard'), 900);
    } catch (err) {
      console.error(err);
      setTempNotification('Registration failed', true);
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
              <Title>Register</Title>

              <Form onSubmit={handleSubmit}>
              <FieldWrapper>
                <Label htmlFor="name">Full Name</Label>
                <IconInput
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your Name"
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FieldWrapper>

              <FieldWrapper>
                <Label htmlFor="organisation">Organisation</Label>
                <IconInput
                  id="organisation"
                  name="organisation"
                  type="text"
                  autoComplete="organization"
                  placeholder="Your Organisation"
                  icon={<Building className="w-5 h-5 text-gray-400" />}
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                />
              </FieldWrapper>

              <FieldWrapper>
                <Label htmlFor="inviteCode">Invite Code</Label>
                <IconInput
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="Enter invite code"
                  icon={<Ticket className="w-5 h-5 text-gray-400" />}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </FieldWrapper>

              <FieldWrapper>
                <Label htmlFor="email">Email Address</Label>
                <IconInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="your.email@example.com"
                  icon={<Mail className="w-5 h-5 text-gray-400" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FieldWrapper>

              <FieldWrapper>
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FieldWrapper>

              <FieldWrapper>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <PasswordInput
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FieldWrapper>

              {notification.show && (
                <Notification $isError={notification.isError}>
                  {notification.message}
                </Notification>
              )}

              <FieldWrapper>
                <SubmitButton type="submit">Register</SubmitButton>
              </FieldWrapper>
              <FieldWrapper>
                <FooterNote>
                  Already have an account?
                  <Link href="/auth/login">
                    <FooterLink>Sign in</FooterLink>
                  </Link>
                  <div style={{marginTop: '0.5rem', fontSize: '0.95em'}}>
                    <a href="https://maddevs.space/onboard" target="_blank" rel="noopener" style={{color: '#786143', textDecoration: 'underline', fontWeight: 500}}>
           Use this link to begin discovery and receive your exclusive invite code.
                    </a>
                  </div>
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
