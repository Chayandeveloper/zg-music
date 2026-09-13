import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { X, User, Phone, ShieldCheck, Sparkles, Music2, Edit3, ArrowRight, RefreshCw } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onSuccess, message }) => {
  const { sendOtp, verifyOtp, authModalMessage } = useAuthStore();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [debugOtpHint, setDebugOtpHint] = useState<string | null>(null);

  const activePrompt = message || authModalMessage;

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setOtp('');
    setStep('PHONE');
    setErrorMessage('');
    setDebugOtpHint(null);
    setLoading(false);
    setCountdown(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const cleanPhone = (val: string) => {
    return val.replace(/[^0-9]/g, '').slice(0, 10);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(cleanPhone(val));
    if (errorMessage) setErrorMessage('');
  };

  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
    if (errorMessage) setErrorMessage('');
  };

  const handleSendOtp = async () => {
    setErrorMessage('');
    const cleaned = cleanPhone(phone);
    if (cleaned.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (mode === 'REGISTER' && !name.trim()) {
      setErrorMessage('Please enter your full name to register.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleaned, mode === 'LOGIN' ? 'login' : 'register');
      setStep('OTP');
      setCountdown(60);
      if (res?.debug_otp) {
        setDebugOtpHint(res.debug_otp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    const cleanedOtp = otp.trim();
    if (cleanedOtp.length < 4) {
      setErrorMessage('Please enter the verification code received on SMS.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        phone: cleanPhone(phone),
        otp: cleanedOtp,
        name: mode === 'REGISTER' ? name.trim() : undefined,
      });
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone(phone), mode === 'LOGIN' ? 'login' : 'register');
      setCountdown(60);
      if (res?.debug_otp) {
        setDebugOtpHint(res.debug_otp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend OTP right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoPhone: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await verifyOtp({ phone: demoPhone, otp: '123456' });
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
              />
              <Text style={styles.headerTitle}>ZUBEEFY</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Active Prompt Banner (e.g., when attempting playback) */}
          {activePrompt ? (
            <View style={styles.promptBanner}>
              <Music2 size={16} color={THEME.colors.primary} />
              <Text style={styles.promptText}>{activePrompt}</Text>
            </View>
          ) : null}

          {/* Mode Switcher */}
          <View style={styles.switchRow}>
            <TouchableOpacity
              onPress={() => {
                setMode('LOGIN');
                setStep('PHONE');
                setErrorMessage('');
              }}
              style={[styles.switchTab, mode === 'LOGIN' && styles.switchTabActive]}
            >
              <Text style={[styles.switchText, mode === 'LOGIN' && styles.switchTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMode('REGISTER');
                setStep('PHONE');
                setErrorMessage('');
              }}
              style={[styles.switchTab, mode === 'REGISTER' && styles.switchTabActive]}
            >
              <Text style={[styles.switchText, mode === 'REGISTER' && styles.switchTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {step === 'PHONE' ? (
              /* STEP 1: Phone Number & Name */
              <View>
                {mode === 'REGISTER' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputBox}>
                      <User size={18} color={THEME.colors.textMuted} />
                      <TextInput
                        placeholder="e.g. Biswajit Saikia"
                        placeholderTextColor={THEME.colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <View style={styles.phoneInputBox}>
                      <Phone size={18} color={THEME.colors.textMuted} />
                      <TextInput
                        placeholder="98765 43210"
                        placeholderTextColor={THEME.colors.textMuted}
                        value={phone}
                        onChangeText={handlePhoneChange}
                        style={styles.input}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                  </View>
                  <Text style={styles.helperText}>
                    We will send you a 6-digit OTP code via SMS for verification.
                  </Text>
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <View style={styles.btnContentRow}>
                      <Text style={styles.submitBtnText}>
                        {mode === 'LOGIN' ? 'Send OTP Code' : 'Continue & Send OTP'}
                      </Text>
                      <ArrowRight size={16} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* STEP 2: Enter 6-digit OTP */
              <View>
                <View style={styles.otpHeaderBox}>
                  <Text style={styles.otpSubtitle}>Enter the 6-digit code sent via SMS to</Text>
                  <View style={styles.phoneBadgeRow}>
                    <Text style={styles.phoneBadgeText}>+91 {phone}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setStep('PHONE');
                        setOtp('');
                        setErrorMessage('');
                      }}
                      style={styles.editPhoneBtn}
                    >
                      <Edit3 size={13} color={THEME.colors.primary} />
                      <Text style={styles.editPhoneText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {debugOtpHint ? (
                  <TouchableOpacity
                    onPress={() => setOtp(debugOtpHint)}
                    style={styles.debugHintBox}
                  >
                    <Sparkles size={13} color={THEME.colors.primary} />
                    <Text style={styles.debugHintText}>
                      Auto-fill OTP: <Text style={styles.debugOtpBold}>{debugOtpHint}</Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code (OTP)</Text>
                  <View style={styles.otpInputBox}>
                    <ShieldCheck size={20} color={THEME.colors.primary} />
                    <TextInput
                      placeholder="••••••"
                      placeholderTextColor={THEME.colors.textMuted}
                      value={otp}
                      onChangeText={handleOtpChange}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                  </View>
                </View>

                {/* Resend row */}
                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.resendCountdownText}>
                      Resend code in <Text style={styles.resendTimerText}>{countdown}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={loading}
                      style={styles.resendBtn}
                    >
                      <RefreshCw size={13} color={THEME.colors.primary} />
                      <Text style={styles.resendBtnText}>Resend SMS Code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {mode === 'LOGIN' ? 'Verify & Sign In' : 'Verify & Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Demo Logins */}
            <View style={styles.quickLoginBox}>
              <Text style={styles.quickLoginTitle}>Quick Demo Sign In:</Text>
              <View style={styles.quickBtnRow}>
                <TouchableOpacity
                  onPress={() => handleQuickDemoLogin('9876543210')}
                  disabled={loading}
                  style={styles.quickBtn}
                >
                  <Text style={styles.quickBtnText}>Listener Demo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleQuickDemoLogin('9876543211')}
                  disabled={loading}
                  style={[styles.quickBtn, styles.quickBtnGold]}
                >
                  <Sparkles size={13} color="#000" />
                  <Text style={styles.quickBtnTextDark}>Artist (Zubeen)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.colors.borderAccent,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    color: THEME.colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  switchTabActive: {
    backgroundColor: THEME.colors.primary,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  switchTextActive: {
    color: '#000',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.danger,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: THEME.colors.danger,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: THEME.colors.borderAccent,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  promptText: {
    flex: 1,
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 6,
    lineHeight: 15,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  phoneInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  otpHeaderBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  otpSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  editPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editPhoneText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  debugHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  debugHintText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  debugOtpBold: {
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 1.5,
  },
  otpInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  resendCountdownText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  resendTimerText: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendBtnText: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  quickLoginBox: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  quickLoginTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  quickBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  quickBtnGold: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  quickBtnTextDark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
});
