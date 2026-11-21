import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from './src/lib/supabase';

type AccountRole = 'teacher' | 'parent';
type AuthMode = 'login' | 'signup';
type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: AccountRole;
};

type Notice = { kind: 'success' | 'error' | 'info'; text: string } | null;

const COLORS = {
  blue: '#1769AA',
  blueDark: '#104F83',
  bluePale: '#EAF3FB',
  orange: '#F28C28',
  orangePale: '#FFF1E2',
  background: '#F4F7FB',
  white: '#FFFFFF',
  text: '#172440',
  muted: '#788596',
  border: '#DFE6EE',
  success: '#168451',
  danger: '#C43D3D',
};

async function getProfile(userId: string): Promise<Profile> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(
      'Your profile was not found. Please check that the Supabase SQL setup has been completed.',
    );
  }
  return data as Profile;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  helperText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  helperText?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA6B5"
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={styles.input}
          selectionColor={COLORS.blue}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPassword((current) => !current)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
          </Pressable>
        ) : null}
      </View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export default function App() {
  const [role, setRole] = useState<AccountRole>('teacher');
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!supabase) {
        if (active) setBooting(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;
        setSession(data.session);
        if (data.session?.user) {
          try {
            const savedProfile = await getProfile(data.session.user.id);
            if (active) setProfile(savedProfile);
          } catch {
            if (active) {
              setProfile(null);
              setNotice({
                kind: 'error',
                text: 'Your account is signed in, but its profile could not be loaded. Check the database setup.',
              });
            }
          }
        }
      } catch (error) {
        if (active) {
          setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not restore your session.' });
        }
      } finally {
        if (active) setBooting(false);
      }
    };

    void restoreSession();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const showNotice = (kind: 'success' | 'error' | 'info', text: string) => {
    setNotice({ kind, text });
  };

  const chooseRole = (nextRole: AccountRole) => {
    setRole(nextRole);
    setMode('login');
    setNotice(null);
  };

  const validateEmailAndPassword = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      showNotice('error', 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      showNotice('error', 'Password must contain at least 8 characters.');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setNotice(null);
    if (!validateEmailAndPassword()) return;
    if (!supabase) {
      showNotice('error', 'Backend is not connected yet. Complete the Supabase setup in the included README, then try again.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Login could not be completed. Please try again.');

      const signedInProfile = await getProfile(data.user.id);
      if (signedInProfile.role !== role) {
        await supabase.auth.signOut();
        throw new Error(
          role === 'teacher'
            ? 'This account is not registered as the Teacher account. Choose Parent / Guardian or contact the administrator.'
            : 'This account is not registered as a Parent / Guardian account.',
        );
      }
      setSession(data.session);
      setProfile(signedInProfile);
      setPassword('');
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setNotice(null);
    if (role !== 'parent') {
      showNotice('error', 'Teacher accounts are created and managed privately by the institute owner.');
      return;
    }
    if (fullName.trim().length < 2) {
      showNotice('error', 'Please enter the parent / guardian full name.');
      return;
    }
    const rawDigits = phone.replace(/\D/g, '');
    const digits = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    if (digits.length !== 10) {
      showNotice('error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!validateEmailAndPassword()) return;
    if (password !== confirmPassword) {
      showNotice('error', 'Password and confirm password do not match.');
      return;
    }
    if (!supabase) {
      showNotice('error', 'Backend is not connected yet. Complete the Supabase setup in the included README, then try again.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: digits,
          },
        },
      });
      if (error) throw error;

      setPassword('');
      setConfirmPassword('');

      if (data.session && data.user) {
        try {
          const newProfile = await getProfile(data.user.id);
          setSession(data.session);
          setProfile(newProfile);
        } catch {
          showNotice('success', 'Your account was created. Your profile is being prepared; please sign in again in a moment.');
          setMode('login');
        }
      } else {
        showNotice('success', 'Registration received. Please check your email for the confirmation link, then return here and sign in.');
        setMode('login');
      }
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setNotice(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      showNotice('error', 'Enter your registered email address first.');
      return;
    }
    if (!supabase) {
      showNotice('error', 'Connect Supabase first to enable password recovery.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      showNotice('success', 'If this email is registered, a password recovery email has been sent. Complete the reset using the email link.');
    } catch (error) {
      showNotice('error', error instanceof Error ? error.message : 'Could not send the recovery email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      Alert.alert('Sign out failed', error.message);
      return;
    }
    setSession(null);
    setProfile(null);
    setRole('teacher');
    setMode('login');
    setNotice({ kind: 'success', text: 'You have been signed out.' });
  };

  if (booting) {
    return (
      <View style={styles.bootScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.blueDark} />
        <View style={styles.logoMark}><Text style={styles.logoMarkText}>EV</Text></View>
        <Text style={styles.bootBrand}>EZEE VISION CHAMPUA</Text>
        <ActivityIndicator color={COLORS.orange} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (session && profile) {
    return (
      <SafeAuthScreen
        profile={profile}
        onSignOut={handleSignOut}
        loading={loading}
      />
    );
  }

  return (
    <SafeAuthScreen>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blueDark} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.pageContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.logoMark}><Text style={styles.logoMarkText}>EV</Text></View>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>CHAMPUA</Text></View>
            </View>
            <Text style={styles.heroEyebrow}>WELCOME TO</Text>
            <Text style={styles.heroTitle}>EZEE VISION</Text>
            <Text style={styles.heroTitleSecond}>CHAMPUA</Text>
            <Text style={styles.heroSubtitle}>Learning. Progress. Together.</Text>
            <View style={styles.orangeAccent} />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardEyebrow}>SECURE ACCESS PORTAL</Text>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Choose your portal to continue.</Text>

            <View style={styles.roleSelector}>
              <Pressable
                onPress={() => chooseRole('teacher')}
                style={[styles.roleOption, role === 'teacher' && styles.roleOptionActive]}
              >
                <Text style={[styles.roleOptionText, role === 'teacher' && styles.roleOptionTextActive]}>Teacher</Text>
              </Pressable>
              <Pressable
                onPress={() => chooseRole('parent')}
                style={[styles.roleOption, role === 'parent' && styles.roleOptionActive]}
              >
                <Text style={[styles.roleOptionText, role === 'parent' && styles.roleOptionTextActive]}>Parent / Guardian</Text>
              </Pressable>
            </View>

            {role === 'parent' ? (
              <View style={styles.modeRow}>
                <Pressable onPress={() => { setMode('login'); setNotice(null); }} style={styles.modeButton}>
                  <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Log In</Text>
                  {mode === 'login' ? <View style={styles.modeUnderline} /> : null}
                </Pressable>
                <Pressable onPress={() => { setMode('signup'); setNotice(null); }} style={styles.modeButton}>
                  <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Create Account</Text>
                  {mode === 'signup' ? <View style={styles.modeUnderline} /> : null}
                </Pressable>
              </View>
            ) : (
              <View style={styles.teacherOnlyNote}>
                <Text style={styles.teacherOnlyTitle}>Teacher portal</Text>
                <Text style={styles.teacherOnlyText}>The institute owner manages the single teacher account. Public teacher sign-up is disabled.</Text>
              </View>
            )}

            {mode === 'signup' && role === 'parent' ? (
              <>
                <Field label="PARENT / GUARDIAN NAME" value={fullName} onChangeText={setFullName} placeholder="Enter your full name" autoCapitalize="words" />
                <Field label="MOBILE NUMBER" value={phone} onChangeText={(value) => setPhone(value.replace(/[^0-9+() -]/g, '').slice(0, 16))} placeholder="Enter 10-digit mobile number" keyboardType="phone-pad" />
              </>
            ) : null}

            <Field label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Enter password (min. 8 characters)" secureTextEntry autoCapitalize="none" />
            {mode === 'signup' && role === 'parent' ? (
              <Field label="CONFIRM PASSWORD" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" secureTextEntry autoCapitalize="none" />
            ) : null}

            {mode === 'login' ? (
              <Pressable onPress={handleForgotPassword} disabled={loading} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            ) : (
              <Text style={styles.signupHelper}>After registration, your child’s records will remain unavailable until the teacher approves your child-link request.</Text>
            )}

            {notice ? (
              <View style={[styles.notice, notice.kind === 'error' ? styles.noticeError : notice.kind === 'success' ? styles.noticeSuccess : styles.noticeInfo]}>
                <Text style={[styles.noticeText, notice.kind === 'error' ? styles.noticeErrorText : notice.kind === 'success' ? styles.noticeSuccessText : styles.noticeInfoText]}>{notice.text}</Text>
              </View>
            ) : null}

            {!supabaseConfigured ? (
              <View style={styles.setupNotice}>
                <Text style={styles.setupNoticeTitle}>Backend setup pending</Text>
                <Text style={styles.setupNoticeText}>The screens are ready. Add your Supabase URL and publishable key in the project .env file, then run the included SQL setup to enable real sign-in and registration.</Text>
              </View>
            ) : null}

            <PrimaryButton
              title={mode === 'signup' && role === 'parent' ? 'CREATE PARENT ACCOUNT' : 'SIGN IN'}
              onPress={mode === 'signup' && role === 'parent' ? handleSignUp : handleLogin}
              loading={loading}
            />

            <Text style={styles.cardFooter}>Your information is protected by account-based access controls.</Text>
          </View>

          <Text style={styles.pageFooter}>© {new Date().getFullYear()} EZEE VISION CHAMPUA</Text>
          <Text style={styles.pageFooterSub}>TEACHER & PARENT MANAGEMENT</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAuthScreen>
  );
}

function SafeAuthScreen({
  children,
  profile,
  onSignOut,
  loading,
}: {
  children?: React.ReactNode;
  profile?: Profile;
  onSignOut?: () => void;
  loading?: boolean;
}) {
  if (profile) {
    const isTeacher = profile.role === 'teacher';
    return (
      <View style={styles.portalScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.blueDark} />
        <View style={styles.portalHeader}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>EV</Text></View>
          <Text style={styles.portalBrand}>EZEE VISION</Text>
          <Text style={styles.portalBrandSmall}>CHAMPUA</Text>
        </View>
        <View style={styles.portalCard}>
          <View style={styles.portalAvatar}><Text style={styles.portalAvatarText}>{profile.full_name?.trim()?.charAt(0)?.toUpperCase() || (isTeacher ? 'T' : 'P')}</Text></View>
          <Text style={styles.portalWelcome}>Welcome, {profile.full_name || (isTeacher ? 'Teacher' : 'Parent')}</Text>
          <Text style={styles.portalRole}>{isTeacher ? 'TEACHER PORTAL' : 'PARENT / GUARDIAN PORTAL'}</Text>
          <Text style={styles.portalMessage}>Your account is authenticated. The {isTeacher ? 'teacher dashboard' : 'approved-child dashboard'} will be added in the next development phase.</Text>
          <PrimaryButton title="SIGN OUT" onPress={onSignOut || (() => undefined)} loading={loading} />
        </View>
      </View>
    );
  }
  return <View style={styles.screen}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  bootScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blueDark },
  bootBrand: { marginTop: 16, color: COLORS.white, fontSize: 18, fontWeight: '800', letterSpacing: 1.4 },
  pageContent: { flexGrow: 1, paddingBottom: 28, backgroundColor: COLORS.background },
  hero: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 26 : 18,
    paddingBottom: 45,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoMark: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#D7E9F8' },
  logoMarkText: { fontSize: 18, fontWeight: '900', color: COLORS.blue, letterSpacing: -1 },
  heroBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  heroBadgeText: { color: COLORS.white, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  heroEyebrow: { color: '#DDEEFF', fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 7 },
  heroTitle: { color: COLORS.white, fontSize: 31, fontWeight: '900', letterSpacing: 1.1 },
  heroTitleSecond: { color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: 2.1, marginTop: 1 },
  heroSubtitle: { color: '#E4F1FC', fontSize: 13, marginTop: 12 },
  orangeAccent: { position: 'absolute', width: 105, height: 7, borderRadius: 9, backgroundColor: COLORS.orange, right: 26, bottom: 20 },
  formCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 18,
    marginTop: -22,
    borderRadius: 25,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#143B5D',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  cardEyebrow: { color: COLORS.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  cardTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900', marginTop: 8 },
  cardSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5, marginBottom: 19 },
  roleSelector: { flexDirection: 'row', backgroundColor: '#EFF3F7', borderRadius: 14, padding: 4, marginBottom: 17 },
  roleOption: { flex: 1, paddingVertical: 12, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  roleOptionActive: { backgroundColor: COLORS.blue, shadowColor: COLORS.blue, shadowOpacity: 0.18, shadowRadius: 5, elevation: 2 },
  roleOptionText: { color: COLORS.muted, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  roleOptionTextActive: { color: COLORS.white },
  modeRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 },
  modeButton: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  modeText: { color: COLORS.muted, fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: COLORS.blue, fontWeight: '900' },
  modeUnderline: { position: 'absolute', height: 3, borderRadius: 3, backgroundColor: COLORS.orange, bottom: -1, left: 15, right: 15 },
  teacherOnlyNote: { backgroundColor: COLORS.bluePale, borderRadius: 13, padding: 13, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: COLORS.orange },
  teacherOnlyTitle: { color: COLORS.blueDark, fontSize: 12, fontWeight: '900', marginBottom: 4 },
  teacherOnlyText: { color: '#526A82', fontSize: 11, lineHeight: 17 },
  fieldWrap: { marginBottom: 13 },
  fieldLabel: { color: COLORS.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 7 },
  inputShell: { minHeight: 51, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBFD', borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 49, color: COLORS.text, fontSize: 14, paddingVertical: 8 },
  passwordToggle: { paddingHorizontal: 5, paddingVertical: 10 },
  passwordToggleText: { fontSize: 9, fontWeight: '900', color: COLORS.blue },
  helperText: { marginTop: 5, color: COLORS.muted, fontSize: 10 },
  forgotButton: { alignSelf: 'flex-end', paddingVertical: 8, marginTop: -3, marginBottom: 13 },
  forgotText: { color: COLORS.blue, fontSize: 12, fontWeight: '800' },
  signupHelper: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 1, marginBottom: 14 },
  notice: { borderRadius: 11, padding: 11, marginBottom: 13, borderWidth: 1 },
  noticeText: { fontSize: 11, lineHeight: 17, fontWeight: '600' },
  noticeError: { backgroundColor: '#FFF1F0', borderColor: '#F3C5C1' },
  noticeErrorText: { color: COLORS.danger },
  noticeSuccess: { backgroundColor: '#EAF7F0', borderColor: '#BCE6CE' },
  noticeSuccessText: { color: COLORS.success },
  noticeInfo: { backgroundColor: COLORS.bluePale, borderColor: '#C6DDEF' },
  noticeInfoText: { color: COLORS.blueDark },
  setupNotice: { backgroundColor: COLORS.orangePale, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F7D5B1' },
  setupNoticeTitle: { color: '#9C5511', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  setupNoticeText: { color: '#805A37', fontSize: 10, lineHeight: 16 },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.blue, borderRadius: 14, paddingHorizontal: 18, marginTop: 4 },
  primaryButtonText: { color: COLORS.white, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  buttonDisabled: { opacity: 0.65 },
  buttonPressed: { backgroundColor: COLORS.blueDark, transform: [{ scale: 0.99 }] },
  cardFooter: { color: '#98A3B1', textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: 17 },
  pageFooter: { textAlign: 'center', color: COLORS.blueDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 23 },
  pageFooterSub: { textAlign: 'center', color: COLORS.muted, fontSize: 9, letterSpacing: 1.1, marginTop: 5 },
  portalScreen: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'flex-start' },
  portalHeader: { backgroundColor: COLORS.blue, alignItems: 'center', paddingTop: 54, paddingBottom: 46, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  portalBrand: { color: COLORS.white, fontSize: 25, fontWeight: '900', marginTop: 12, letterSpacing: 1 },
  portalBrandSmall: { color: '#FFE2C2', fontSize: 14, fontWeight: '900', letterSpacing: 3, marginTop: 3 },
  portalCard: { marginHorizontal: 20, marginTop: -22, backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  portalAvatar: { width: 66, height: 66, borderRadius: 23, backgroundColor: COLORS.orangePale, borderWidth: 1, borderColor: '#F7D5B1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  portalAvatarText: { color: COLORS.orange, fontSize: 27, fontWeight: '900' },
  portalWelcome: { color: COLORS.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  portalRole: { color: COLORS.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginTop: 8 },
  portalMessage: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 18, marginBottom: 18 },
});
