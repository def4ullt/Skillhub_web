export const getAdminToken = async () => {
  const res = await fetch('/keycloak-admin/realms/master/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username: 'admin', password: 'admin' }),
  })
  return (await res.json()).access_token
}

export const getKeycloakUser = async (userId) => {
  const token = await getAdminToken()
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return { user: await res.json(), token }
}

export const updateKeycloakUser = async (userId, patch) => {
  const { user, token } = await getKeycloakUser(userId) ?? {}
  if (!user) throw new Error('Could not fetch user')

  const { attributes: patchAttrs, ...rest } = patch

  const payload = {
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    enabled: true,
    emailVerified: true,
    requiredActions: [],
    ...rest,
    attributes: { ...(user.attributes ?? {}), ...(patchAttrs ?? {}) },
  }

  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  return res.ok
}

export const deleteKeycloakUser = async (userId) => {
  const { token } = await getKeycloakUser(userId) ?? {}
  if (!token) throw new Error('Could not get token')
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}

export const getKeycloakUsers = async () => {
  const token = await getAdminToken()
  const res = await fetch('/keycloak-admin/admin/realms/skillhub/users?max=200', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return []
  return await res.json()
}

export const resetKeycloakPassword = async (userId, newPassword) => {
  const { token } = await getKeycloakUser(userId) ?? {}
  if (!token) throw new Error('Could not get token')
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}/reset-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'password', value: newPassword, temporary: false }),
  })
  return res.ok
}

export const setKeycloakUserEnabled = async (userId, enabled) => {
  const result = await getKeycloakUser(userId)
  if (!result) throw new Error('Could not fetch user')
  const { user, token } = result
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled,
      emailVerified: user.emailVerified ?? true,
      requiredActions: user.requiredActions ?? [],
      attributes: user.attributes ?? {},
    }),
  })
  if (res.ok && !enabled) {
    await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}/sessions`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  return res.ok
}

export const findKeycloakUserByEmail = async (email) => {
  const token = await getAdminToken()
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users?email=${encodeURIComponent(email)}&exact=true`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const users = await res.json()
  return users[0] ?? null
}

export const findKeycloakUserByUsername = async (username) => {
  const token = await getAdminToken()
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users?username=${encodeURIComponent(username)}&exact=true`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const users = await res.json()
  return users[0] ?? null
}

export const findKeycloakUser = async (identifier) => {
  const isEmail = identifier.includes('@')
  if (isEmail) {
    const byEmail = await findKeycloakUserByEmail(identifier)
    if (byEmail) return byEmail
  }
  return await findKeycloakUserByUsername(identifier)
}

// Sends a password-reset email via Keycloak (requires SMTP configured in Realm Settings).
// Use this instead of resetKeycloakPassword when email is set up in production.
export const sendPasswordResetEmail = async (userId) => {
  const { token } = await getAdminToken().then(t => ({ token: t }))
  const res = await fetch(`/keycloak-admin/admin/realms/skillhub/users/${userId}/execute-actions-email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(['UPDATE_PASSWORD']),
  })
  return res.ok
}
