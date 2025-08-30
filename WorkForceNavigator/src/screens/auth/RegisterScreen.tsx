import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Text
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  HelperText,
  Menu
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/authSlice';
import { RootState, AppDispatch } from '../../store/store';
import { RegisterData, UserRole } from '../../types/auth';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const { height } = Dimensions.get('window');

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.TECHNICIAN,
    employeeId: '',
    phoneNumber: '',
    department: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const roleOptions = [
    { label: 'Technician', value: UserRole.TECHNICIAN },
    { label: 'Manager', value: UserRole.MANAGER },
    { label: 'Administrator', value: UserRole.ADMIN }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone number validation (optional but if provided, should be valid)
    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      dispatch(clearError());
      await dispatch(register(formData)).unwrap();
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      Alert.alert('Registration Failed', error || 'An error occurred during registration');
    }
  };

  const handleInputChange = (field: keyof RegisterData | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
    setShowRoleMenu(false);
  };

  return (
    <LinearGradient
      colors={['#f093fb', '#f5576c', '#4facfe']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Logo/Brand Section */}
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>✨</Text>
              </View>
              <Text style={styles.brandTitle}>Join Our Team</Text>
              <Text style={styles.brandSubtitle}>
                Create your WorkForce Navigator account
              </Text>
            </View>

            {/* Register Card */}
            <Card style={styles.card} elevation={5}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.welcomeText}>Get Started</Text>
                <Text style={styles.signUpText}>Fill in your details below</Text>

                <View style={styles.inputContainer}>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <TextInput
                        label="First Name"
                        value={formData.firstName}
                        onChangeText={(value) => handleInputChange('firstName', value)}
                        mode="outlined"
                        error={!!errors.firstName}
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: '#f5576c',
                            outline: errors.firstName ? '#ff6b6b' : '#e0e0e0'
                          }
                        }}
                        left={<TextInput.Icon icon="account" color="#f5576c" />}
                      />
                      <HelperText type="error" visible={!!errors.firstName} style={styles.helperText}>
                        {errors.firstName}
                      </HelperText>
                    </View>

                    <View style={styles.halfWidth}>
                      <TextInput
                        label="Last Name"
                        value={formData.lastName}
                        onChangeText={(value) => handleInputChange('lastName', value)}
                        mode="outlined"
                        error={!!errors.lastName}
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: '#f5576c',
                            outline: errors.lastName ? '#ff6b6b' : '#e0e0e0'
                          }
                        }}
                        left={<TextInput.Icon icon="account" color="#f5576c" />}
                      />
                      <HelperText type="error" visible={!!errors.lastName} style={styles.helperText}>
                        {errors.lastName}
                      </HelperText>
                    </View>
                  </View>

                  <TextInput
                    label="Email Address"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={!!errors.email}
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: '#f5576c',
                        outline: errors.email ? '#ff6b6b' : '#e0e0e0'
                      }
                    }}
                    left={<TextInput.Icon icon="email" color="#f5576c" />}
                  />
                  <HelperText type="error" visible={!!errors.email} style={styles.helperText}>
                    {errors.email}
                  </HelperText>

                  <TextInput
                    label="Password"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    error={!!errors.password}
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: '#f5576c',
                        outline: errors.password ? '#ff6b6b' : '#e0e0e0'
                      }
                    }}
                    left={<TextInput.Icon icon="lock" color="#f5576c" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        color="#f5576c"
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.password} style={styles.helperText}>
                    {errors.password}
                  </HelperText>

                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    mode="outlined"
                    secureTextEntry={!showConfirmPassword}
                    error={!!errors.confirmPassword}
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: '#f5576c',
                        outline: errors.confirmPassword ? '#ff6b6b' : '#e0e0e0'
                      }
                    }}
                    left={<TextInput.Icon icon="lock-check" color="#f5576c" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                        color="#f5576c"
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.confirmPassword} style={styles.helperText}>
                    {errors.confirmPassword}
                  </HelperText>

                  <Menu
                    visible={showRoleMenu}
                    onDismiss={() => setShowRoleMenu(false)}
                    anchor={
                      <TextInput
                        label="Role"
                        value={roleOptions.find(r => r.value === formData.role)?.label || ''}
                        mode="outlined"
                        editable={false}
                        onPressIn={() => setShowRoleMenu(true)}
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: '#f5576c',
                            outline: '#e0e0e0'
                          }
                        }}
                        left={<TextInput.Icon icon="account-group" color="#f5576c" />}
                        right={<TextInput.Icon icon="chevron-down" color="#f5576c" />}
                      />
                    }
                  >
                    {roleOptions.map((option) => (
                      <Menu.Item
                        key={option.value}
                        onPress={() => handleRoleSelect(option.value)}
                        title={option.label}
                      />
                    ))}
                  </Menu>

                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <TextInput
                        label="Employee ID"
                        value={formData.employeeId}
                        onChangeText={(value) => handleInputChange('employeeId', value)}
                        mode="outlined"
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: '#f5576c',
                            outline: '#e0e0e0'
                          }
                        }}
                        left={<TextInput.Icon icon="badge-account" color="#f5576c" />}
                      />
                    </View>

                    <View style={styles.halfWidth}>
                      <TextInput
                        label="Phone Number"
                        value={formData.phoneNumber}
                        onChangeText={(value) => handleInputChange('phoneNumber', value)}
                        mode="outlined"
                        keyboardType="phone-pad"
                        error={!!errors.phoneNumber}
                        style={styles.input}
                        theme={{
                          colors: {
                            primary: '#f5576c',
                            outline: errors.phoneNumber ? '#ff6b6b' : '#e0e0e0'
                          }
                        }}
                        left={<TextInput.Icon icon="phone" color="#f5576c" />}
                      />
                    </View>
                  </View>
                  <HelperText type="error" visible={!!errors.phoneNumber} style={styles.helperText}>
                    {errors.phoneNumber}
                  </HelperText>

                  <TextInput
                    label="Department"
                    value={formData.department}
                    onChangeText={(value) => handleInputChange('department', value)}
                    mode="outlined"
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: '#f5576c',
                        outline: '#e0e0e0'
                      }
                    }}
                    left={<TextInput.Icon icon="office-building" color="#f5576c" />}
                  />
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                )}

                <LinearGradient
                  colors={['#f5576c', '#f093fb']}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.registerButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                    buttonColor="transparent"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </LinearGradient>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  mode="outlined"
                  onPress={onNavigateToLogin}
                  disabled={isLoading}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.loginButtonLabel}
                  theme={{
                    colors: {
                      outline: '#f5576c'
                    }
                  }}
                >
                  Already have an account?
                </Button>
              </Card.Content>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoIcon: {
    fontSize: 40,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  cardContent: {
    padding: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  signUpText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#ffffff',
  },
  helperText: {
    marginBottom: 12,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
    textAlign: 'center',
  },
  registerButtonGradient: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#f5576c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#7f8c8d',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 12,
    borderWidth: 2,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5576c',
  },
});