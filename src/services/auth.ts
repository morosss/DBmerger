/**
 * Simple authentication service for user management
 * Stores user credentials in localStorage (client-side only)
 * For production, consider using a proper backend authentication system
 */

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  createdAt: Date
}

interface StoredUser extends User {
  passwordHash: string
}

const USERS_KEY = 'app_users'
const CURRENT_USER_KEY = 'current_user'
const SESSION_KEY = 'user_session'

/**
 * Simple hash function (NOT cryptographically secure - for demo only)
 * In production, use proper backend authentication with bcrypt, etc.
 */
function simpleHash(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Initialize default admin user if no users exist
 */
function initializeDefaultUser(): void {
  const users = getUsers()
  if (users.length === 0) {
    const defaultAdmin: StoredUser = {
      id: 'admin_default',
      username: 'admin',
      email: 'admin@dbmerger.local',
      passwordHash: simpleHash('admin123'),
      role: 'admin',
      createdAt: new Date()
    }
    saveUsers([defaultAdmin])
    console.log('Default admin user created: username=admin, password=admin123')
  }
}

/**
 * Get all users from localStorage
 */
function getUsers(): StoredUser[] {
  try {
    const usersJson = localStorage.getItem(USERS_KEY)
    if (!usersJson) {
      initializeDefaultUser()
      return getUsers()
    }
    const users = JSON.parse(usersJson)
    return users.map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt)
    }))
  } catch (error) {
    console.error('Failed to load users:', error)
    return []
  }
}

/**
 * Save users to localStorage
 */
function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<User> {
  const users = getUsers()
  const passwordHash = simpleHash(password)

  const user = users.find(u =>
    u.username === username && u.passwordHash === passwordHash
  )

  if (!user) {
    throw new Error('Invalid username or password')
  }

  // Create session
  const session = {
    userId: user.id,
    loginTime: new Date().toISOString()
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  // Store current user (without password)
  const { passwordHash: _, ...userWithoutPassword } = user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword))

  return userWithoutPassword
}

/**
 * Logout current user
 */
export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
}

/**
 * Get current logged-in user
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY)
    if (!userJson) return null

    const user = JSON.parse(userJson)
    return {
      ...user,
      createdAt: new Date(user.createdAt)
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Check if user is logged in
 */
export function isAuthenticated(): boolean {
  const session = localStorage.getItem(SESSION_KEY)
  const user = localStorage.getItem(CURRENT_USER_KEY)
  return !!(session && user)
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Create new user (admin only)
 */
export async function createUser(
  username: string,
  email: string,
  password: string,
  role: 'admin' | 'user'
): Promise<User> {
  if (!isAdmin()) {
    throw new Error('Only admins can create users')
  }

  const users = getUsers()

  // Check if username already exists
  if (users.some(u => u.username === username)) {
    throw new Error('Username already exists')
  }

  // Check if email already exists
  if (users.some(u => u.email === email)) {
    throw new Error('Email already exists')
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username,
    email,
    passwordHash: simpleHash(password),
    role,
    createdAt: new Date()
  }

  users.push(newUser)
  saveUsers(users)

  const { passwordHash: _, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

/**
 * Get all users (admin only, without passwords)
 */
export function getAllUsers(): User[] {
  if (!isAdmin()) {
    throw new Error('Only admins can view all users')
  }

  const users = getUsers()
  return users.map(u => {
    const { passwordHash: _, ...userWithoutPassword } = u
    return userWithoutPassword
  })
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  if (!isAdmin()) {
    throw new Error('Only admins can delete users')
  }

  const currentUser = getCurrentUser()
  if (currentUser?.id === userId) {
    throw new Error('Cannot delete your own account')
  }

  const users = getUsers()
  const filteredUsers = users.filter(u => u.id !== userId)
  saveUsers(filteredUsers)
}

/**
 * Change password
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    throw new Error('Not authenticated')
  }

  const users = getUsers()
  const oldPasswordHash = simpleHash(oldPassword)
  const user = users.find(u => u.id === currentUser.id && u.passwordHash === oldPasswordHash)

  if (!user) {
    throw new Error('Current password is incorrect')
  }

  user.passwordHash = simpleHash(newPassword)
  saveUsers(users)
}

// Initialize on module load
initializeDefaultUser()
