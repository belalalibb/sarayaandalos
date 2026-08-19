export type Bindings = {
  DB: D1Database
}

export type AdminUser = {
  id: number
  username: string
  name: string
  role: string
}

export type Variables = {
  user: AdminUser
}
