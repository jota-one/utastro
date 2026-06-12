import config from '@/config'

export const getAcl = (userRole?: string) => {
  return config.acl.reduce((roles: string[], role: string) => {
    if (role === userRole || roles.includes(userRole || '')) {
      roles.push(role)
    }
    return roles
  }, [])
}
