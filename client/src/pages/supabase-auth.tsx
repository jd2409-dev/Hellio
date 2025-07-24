import React, { useState } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle, Lock, Mail, User, LogOut, UserPlus, LogIn } from 'lucide-react'
import SupabaseConnectionStatus from '@/components/supabase-connection-status'

export default function SupabaseAuth() {
  const { 
    user, 
    session, 
    loading, 
    isAuthenticated, 
    isConfigured, 
    signIn, 
    signUp, 
    signOut, 
    resetPassword 
  } = useSupabaseAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    resetEmail: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const { toast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive"
      })
      return
    }

    setFormLoading(true)
    const { error } = await signIn(formData.email, formData.password)
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error instanceof Error ? error.message : 'An error occurred during sign in',
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Successfully signed in!"
      })
      setFormData({ ...formData, email: '', password: '' })
    }
    setFormLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive"
      })
      return
    }

    setFormLoading(true)
    const { error } = await signUp(formData.email, formData.password, {
      firstName: formData.firstName,
      lastName: formData.lastName
    })
    
    if (error) {
      toast({
        title: "Sign Up Error",
        description: error instanceof Error ? error.message : 'An error occurred during sign up',
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Account created! Check your email for verification."
      })
      setFormData({ email: '', password: '', firstName: '', lastName: '', resetEmail: '' })
    }
    setFormLoading(false)
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error instanceof Error ? error.message : 'An error occurred during sign out',
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Successfully signed out!"
      })
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.resetEmail) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    setFormLoading(true)
    const { error } = await resetPassword(formData.resetEmail)
    
    if (error) {
      toast({
        title: "Reset Password Error",
        description: error instanceof Error ? error.message : 'An error occurred during password reset',
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Password reset email sent! Check your inbox."
      })
      setFormData({ ...formData, resetEmail: '' })
    }
    setFormLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Supabase Authentication Demo</h1>
      </div>

      <SupabaseConnectionStatus />

      {!isConfigured ? null : isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Welcome Back!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                Successfully authenticated
              </p>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email Verified:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</p>
                <p><strong>Last Sign In:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="reset">Reset Password</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={formLoading} className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    {formLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="John"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Doe"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create a strong password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={formLoading} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {formLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="reset" className="space-y-4">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="reset-email"
                        type="email"
                        value={formData.resetEmail}
                        onChange={(e) => setFormData({ ...formData, resetEmail: e.target.value })}
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={formLoading} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    {formLoading ? 'Sending...' : 'Send Reset Email'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* API Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication API Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Import authentication hooks and services
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { authService } from '@/lib/supabaseClient'

// Use in React components
const { user, isAuthenticated, signIn, signOut } = useSupabaseAuth()

// Sign up a new user
const { data, error } = await authService.signUp(
  'user@example.com', 
  'password123',
  { firstName: 'John', lastName: 'Doe' }
)

// Sign in existing user
const { data, error } = await authService.signIn('user@example.com', 'password123')

// Sign out current user
const { error } = await authService.signOut()

// Reset password
const { error } = await authService.resetPassword('user@example.com')

// Get current user
const { data, error } = await authService.getCurrentUser()

// Listen to auth state changes
authService.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
})`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}