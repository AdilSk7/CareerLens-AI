import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { 
  type User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "../lib/firebase"

export interface UserProfile {
  uid: string
  name: string
  email: string
  createdAt: string
}

interface AuthContextType {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, pass: string) => Promise<any>
  register: (name: string, email: string, pass: string) => Promise<any>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function register(name: string, email: string, pass: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass)
    const user = userCredential.user
    
    // Create user profile in Firestore
    const profileData: UserProfile = {
      uid: user.uid,
      name,
      email,
      createdAt: new Date().toISOString()
    }
    
    try {
      await setDoc(doc(db, "users", user.uid), profileData)
    } catch (error) {
      console.error("Failed to save profile to Firestore (check rules/setup):", error)
    }
    setUserProfile(profileData)
    
    return userCredential
  }

  function login(email: string, pass: string) {
    return signInWithEmailAndPassword(auth, email, pass)
  }

  function logout() {
    return signOut(auth)
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile)
          } else {
            console.warn("No profile found for user")
            setUserProfile({
              uid: user.uid,
              name: user.displayName || "User",
              email: user.email || "",
              createdAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error("Error fetching user profile (check Firestore rules/setup):", error)
          setUserProfile({
            uid: user.uid,
            name: user.displayName || "User",
            email: user.email || "",
            createdAt: new Date().toISOString()
          })
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
