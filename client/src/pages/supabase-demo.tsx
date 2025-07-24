import React, { useState, useEffect } from 'react'
import { userService, type User, isSupabaseConfigured } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Edit, Search, Plus, Users, Database, AlertCircle, CheckCircle } from 'lucide-react'

export default function SupabaseDemo() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    profileImageUrl: '',
    xp: 0,
    coins: 0,
    level: 1,
    studyStreak: 0
  })
  const { toast } = useToast()

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await userService.getAllUsers()
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load users from Supabase",
        variant: "destructive"
      })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName) {
      toast({
        title: "Validation Error",
        description: "Email, first name, and last name are required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    const { data, error } = await userService.createUser(newUser)
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "User created successfully"
      })
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        profileImageUrl: '',
        xp: 0,
        coins: 0,
        level: 1,
        studyStreak: 0
      })
      loadUsers()
    }
    setLoading(false)
  }

  const handleUpdateUser = async () => {
    if (!editingUser?.id) return

    setLoading(true)
    const { data, error } = await userService.updateUser(editingUser.id, editingUser)
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "User updated successfully"
      })
      setEditingUser(null)
      loadUsers()
    }
    setLoading(false)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    setLoading(true)
    const { error } = await userService.deleteUser(id)
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "User deleted successfully"
      })
      loadUsers()
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers()
      return
    }

    setLoading(true)
    const { data, error } = await userService.searchUsers(searchQuery)
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      })
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const isConfigured = isSupabaseConfigured()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Supabase CRUD Demo</h1>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            {isConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            <span className="font-medium">
              Supabase Status: {isConfigured ? 'Connected' : 'Not Configured'}
            </span>
          </div>
          
          {!isConfigured && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                Supabase is not configured. To use this demo, you need to:
              </p>
              <ol className="text-sm text-orange-800 dark:text-orange-200 space-y-1 ml-4 list-decimal">
                <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Replit Secrets</li>
                <li>Create the users table in your Supabase database</li>
              </ol>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-2">
                See <code>SUPABASE_SETUP.md</code> for detailed instructions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={newUser.firstName}
                onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={newUser.lastName}
                onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                placeholder="Doe"
              />
            </div>
            <div>
              <Label htmlFor="profileImageUrl">Profile Image URL</Label>
              <Input
                id="profileImageUrl"
                value={newUser.profileImageUrl}
                onChange={(e) => setNewUser({...newUser, profileImageUrl: e.target.value})}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div>
              <Label htmlFor="xp">XP</Label>
              <Input
                id="xp"
                type="number"
                value={newUser.xp}
                onChange={(e) => setNewUser({...newUser, xp: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="coins">Coins</Label>
              <Input
                id="coins"
                type="number"
                value={newUser.coins}
                onChange={(e) => setNewUser({...newUser, coins: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateUser} 
            disabled={loading || !isConfigured}
            className="mt-4"
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </CardContent>
      </Card>

      {/* Search Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !isConfigured}>
              Search
            </Button>
            <Button onClick={loadUsers} variant="outline" disabled={loading || !isConfigured}>
              Show All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found. Create your first user above!
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    {editingUser?.id === user.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          value={editingUser?.firstName || ''}
                          onChange={(e) => editingUser && setEditingUser({...editingUser, firstName: e.target.value})}
                          placeholder="First Name"
                        />
                        <Input
                          value={editingUser?.lastName || ''}
                          onChange={(e) => editingUser && setEditingUser({...editingUser, lastName: e.target.value})}
                          placeholder="Last Name"
                        />
                        <Input
                          value={editingUser?.email || ''}
                          onChange={(e) => editingUser && setEditingUser({...editingUser, email: e.target.value})}
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          XP: {user.xp || 0} | Coins: {user.coins || 0} | Level: {user.level || 1}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingUser?.id === user.id ? (
                      <>
                        <Button onClick={handleUpdateUser} size="sm">
                          Save
                        </Button>
                        <Button onClick={() => setEditingUser(null)} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setEditingUser(user)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(user.id!)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Example API Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Import the Supabase client
import { userService } from '@/lib/supabaseClient'

// Create a user
const { data, error } = await userService.createUser({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  xp: 100,
  coins: 50
})

// Get all users
const { data: users } = await userService.getAllUsers()

// Get user by ID
const { data: user } = await userService.getUserById('user-id')

// Update user
const { data: updatedUser } = await userService.updateUser('user-id', {
  xp: 200,
  coins: 75
})

// Delete user
const { error } = await userService.deleteUser('user-id')

// Search users
const { data: searchResults } = await userService.searchUsers('john')`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}