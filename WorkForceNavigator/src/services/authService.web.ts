// Web-compatible authentication service
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { User, UserRole, RegisterData, LoginCredentials, UserProfile } from '../types/auth';

// Lazy load Firebase services to avoid initialization issues
let firebaseAuth: any = null;
let firebaseFirestore: any = null;

const getFirebaseServices = async () => {
  if (!firebaseAuth || !firebaseFirestore) {
    const { firebaseAuth: auth, firebaseFirestore: firestore } = await import('../config/firebase.web');
    firebaseAuth = auth;
    firebaseFirestore = firestore;
  }
  return { firebaseAuth, firebaseFirestore };
};

class AuthService {
  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<User> {
    try {
      const { firebaseAuth } = await getFirebaseServices();
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        credentials.email,
        credentials.password
      );

      const user = await this.getUserProfile(userCredential.user.uid);
      
      // Update last login time
      await this.updateLastLogin(userCredential.user.uid);
      
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register new user with role-based profile
   */
  async register(registerData: RegisterData): Promise<User> {
    try {
      const { firebaseAuth } = await getFirebaseServices();
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        registerData.email,
        registerData.password
      );

      // Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: `${registerData.firstName} ${registerData.lastName}`
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phoneNumber: registerData.phoneNumber,
        employeeId: registerData.employeeId,
        department: registerData.department,
        skills: []
      };

      const user: User = {
        uid: userCredential.user.uid,
        email: registerData.email,
        displayName: `${registerData.firstName} ${registerData.lastName}`,
        role: registerData.role,
        profile: userProfile,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await this.saveUserProfile(user);
      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const { firebaseAuth } = await getFirebaseServices();
      await signOut(firebaseAuth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<FirebaseUser | null> {
    const { firebaseAuth } = await getFirebaseServices();
    return firebaseAuth.currentUser;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // Return a function that will set up the listener when called
    let unsubscribe: (() => void) | null = null;
    
    getFirebaseServices().then(({ firebaseAuth }) => {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const user = await this.getUserProfile(firebaseUser.uid);
            callback(user);
          } catch (error) {
            console.error('Error getting user profile:', error);
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    }).catch((error) => {
      console.error('Error setting up auth state listener:', error);
      callback(null);
    });

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  /**
   * Get user profile from Firestore
   */
  private async getUserProfile(uid: string): Promise<User> {
    const { firebaseFirestore } = await getFirebaseServices();
    const userDoc = await getDoc(doc(firebaseFirestore, 'users', uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('User data is empty');
    }

    return {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      profile: userData.profile,
      createdAt: userData.createdAt?.toDate() || new Date(),
      lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
    };
  }

  /**
   * Save user profile to Firestore
   */
  private async saveUserProfile(user: User): Promise<void> {
    const { firebaseFirestore } = await getFirebaseServices();
    await setDoc(doc(firebaseFirestore, 'users', user.uid), {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    });
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(uid: string): Promise<void> {
    const { firebaseFirestore } = await getFirebaseServices();
    await updateDoc(doc(firebaseFirestore, 'users', uid), {
      lastLoginAt: new Date()
    });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const { firebaseFirestore } = await getFirebaseServices();
      const updateData: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        updateData[`profile.${key}`] = updates[key as keyof UserProfile];
      });
      
      await updateDoc(doc(firebaseFirestore, 'users', uid), updateData);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User | null, requiredRole: UserRole): boolean {
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === UserRole.ADMIN) return true;
    
    // Manager has access to manager and technician features
    if (user.role === UserRole.MANAGER && requiredRole === UserRole.TECHNICIAN) return true;
    
    // Exact role match
    return user.role === requiredRole;
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): Error {
    let message = 'An authentication error occurred';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No user found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      default:
        message = error.message || message;
    }
    
    return new Error(message);
  }
}

export const authService = new AuthService();