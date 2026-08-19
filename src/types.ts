export type Bindings = {
  DB: D1Database
}

export type AdminUser = {
  id: number
  username: string
  name: string
  role: 'super_admin' | 'content_manager' | 'sales' | 'editor'
  active: number
}

export type Variables = {
  user: AdminUser
}
