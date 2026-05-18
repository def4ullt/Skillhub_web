import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'skillhub',
  clientId: 'skillhub-client',
})

export const getRole = () => {
  const roles = keycloak.tokenParsed?.realm_access?.roles ?? []
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('mentor')) return 'mentor'
  if (roles.includes('student')) return 'student'
  return null
}

export const getUserId = () => keycloak.tokenParsed?.sub ?? null

export default keycloak