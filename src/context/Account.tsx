import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  MODULES,
  TYPE_PROFILES,
  hashPassword,
  normalizePhone,
  seedDb,
  seedRoles,
  uid,
  type Account,
  type Admin,
  type Business,
  type BusinessStatus,
  type Db,
  type ModuleKey,
  type OnboardingDraft,
  type Perm,
  type Role,
  type TypeProfile,
} from '@/data/account'

const DB_KEY = 'weftex-demo-db'
const SESSION_KEY = 'weftex-session'
const ADMIN_KEY = 'weftex-admin-session'
const OTP_KEY = 'weftex-otp'
const PREVIEW_KEY = 'weftex-preview-as'

/* Storage can be blocked (private mode, previews); the demo then runs for this tab only. */
const store = {
  get(area: 'local' | 'session', key: string) {
    try {
      return (area === 'local' ? localStorage : sessionStorage).getItem(key)
    } catch {
      return null
    }
  },
  set(area: 'local' | 'session', key: string, value: string | null) {
    try {
      const s = area === 'local' ? localStorage : sessionStorage
      if (value === null) s.removeItem(key)
      else s.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
}

function readJson<T>(area: 'local' | 'session', key: string): T | null {
  const raw = store.get(area, key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Remember me keeps the session in localStorage (30 days); otherwise it ends with the browser (2.1). */
function readSession(): string | null {
  const s = readJson<{ userId: string; expires: number }>('local', SESSION_KEY) ?? readJson<{ userId: string; expires: number }>('session', SESSION_KEY)
  return s && s.expires > Date.now() ? s.userId : null
}

export interface Otp {
  purpose: 'phone' | 'admin'
  targetId: string
  code: string
  expires: number
  sentAt: number
  tries: number
}

export interface SignUpInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

type SignInResult = { ok: true; account: Account } | { ok: false; error: string }

interface AccountState {
  ready: boolean
  db: Db | null
  /** The signed-in person, or the user the Owner is previewing as. */
  me?: Account
  /** The Owner behind a preview, if one is running. */
  previewedBy?: Account
  business?: Business
  role?: Role
  profile: TypeProfile
  isOwner: boolean
  can: (module: ModuleKey, action?: keyof Perm) => boolean
  seeMoney: boolean
  landingFor: (a: Account) => string

  signIn: (identifier: string, password: string, remember: boolean) => Promise<SignInResult>
  signOut: () => void
  signUp: (input: SignUpInput) => Promise<{ ok: true } | { ok: false; errors: Partial<Record<keyof SignUpInput | 'form', string>> }>

  otp: Otp | null
  sendOtp: (purpose: Otp['purpose'], targetId: string) => void
  checkOtp: (code: string) => { ok: true } | { ok: false; error: string }
  verifyEmail: () => void

  saveOnboarding: (draft: OnboardingDraft) => void
  finishOnboarding: () => void
  updateBusiness: (patch: Partial<Business>) => void
  resubmit: () => void

  admin?: Admin
  adminCheckPassword: (email: string, password: string) => Promise<Admin | null>
  adminSignOut: () => void
  setBusinessStatus: (businessId: string, status: BusinessStatus, action: string, reason?: string) => void

  saveRole: (role: Role) => void
  deleteRole: (roleId: string) => void
  saveUser: (account: Account) => void
  previewAs: (userId: string | null) => void
}

const Ctx = createContext<AccountState | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(() => readJson<Db>('local', DB_KEY))
  const [userId, setUserId] = useState<string | null>(readSession)
  const [adminId, setAdminId] = useState<string | null>(() => store.get('session', ADMIN_KEY))
  const [previewId, setPreviewId] = useState<string | null>(() => store.get('session', PREVIEW_KEY))
  const [otp, setOtp] = useState<Otp | null>(() => readJson<Otp>('session', OTP_KEY))

  useEffect(() => {
    if (!db) seedDb().then(setDb)
  }, [db])

  const update = useCallback((fn: (d: Db) => Db) => {
    setDb((d) => {
      if (!d) return d
      const next = fn(structuredClone(d))
      store.set('local', DB_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // An approval made in another tab (e.g. /admin) shows up here at once.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY && e.newValue) setDb(JSON.parse(e.newValue) as Db)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Persist the seed the first time.
  useEffect(() => {
    if (db && !store.get('local', DB_KEY)) store.set('local', DB_KEY, JSON.stringify(db))
  }, [db])

  const realMe = db?.accounts.find((a) => a.id === userId)
  const previewUser = previewId ? db?.accounts.find((a) => a.id === previewId && a.businessId === realMe?.businessId) : undefined
  const me = previewUser ?? realMe
  const business = db?.businesses.find((b) => b.id === me?.businessId)
  const role = db?.roles.find((r) => r.id === me?.roleId)
  const profile = TYPE_PROFILES[business?.type ?? 'weaving']
  const isOwner = role?.systemKey === 'owner'

  const can = useCallback(
    (module: ModuleKey, action: keyof Perm = 'view') => {
      if (!me || !role) return false
      if (role.systemKey === 'owner') return true
      const perms = role.systemKey === 'supervisor' ? me.supervisorPerms : role.perms
      return !!perms?.[module]?.[action]
    },
    [me, role],
  )
  const seeMoney = isOwner || (role?.systemKey === 'supervisor' ? !!me?.supervisorSeeMoney : !!role?.seeMoney)

  const landingFor = useCallback(
    (a: Account) => {
      if (!db) return '/login'
      // Only self sign-ups go through the phone check and onboarding; invited users join an existing business.
      if (!a.businessId) return a.phoneVerified ? '/onboarding' : '/signup/verify'
      const b = db.businesses.find((x) => x.id === a.businessId)
      if (!b || b.status !== 'Active') return '/pending'
      const r = db.roles.find((x) => x.id === a.roleId)
      if (!r || r.systemKey === 'owner') return '/'
      const perms = r.systemKey === 'supervisor' ? a.supervisorPerms : r.perms
      const home = r.homePage && perms?.[r.homePage]?.view ? r.homePage : MODULES.find((m) => m.to && perms?.[m.key]?.view)?.key
      return MODULES.find((m) => m.key === home)?.to ?? '/no-access'
    },
    [db],
  )

  const startSession = useCallback((id: string, remember: boolean) => {
    const value = JSON.stringify({ userId: id, expires: Date.now() + 30 * 24 * 3600 * 1000 })
    store.set('local', SESSION_KEY, remember ? value : null)
    store.set('session', SESSION_KEY, remember ? null : value)
    store.set('session', PREVIEW_KEY, null)
    setPreviewId(null)
    setUserId(id)
  }, [])

  const signIn = useCallback(
    async (identifier: string, password: string, remember: boolean): Promise<SignInResult> => {
      if (!db) return { ok: false, error: 'Please try again in a moment.' }
      const id = identifier.trim()
      const phone = /^(03|\+92)/.test(id.replace(/\s/g, '')) ? normalizePhone(id) : null
      const key = (phone ?? id).toLowerCase()
      const lock = db.failedLogins[key]
      if (lock?.until && lock.until > Date.now()) {
        const mins = Math.ceil((lock.until - Date.now()) / 60000)
        return { ok: false, error: `Too many failed tries. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` }
      }
      const hash = await hashPassword(password)
      const acc = db.accounts.find((a) => (phone ? a.phone === phone : a.email.toLowerCase() === key) && a.passwordHash && a.passwordHash === hash)
      if (!acc) {
        update((d) => {
          const count = (d.failedLogins[key]?.count ?? 0) + 1
          d.failedLogins[key] = count >= 5 ? { count: 0, until: Date.now() + 15 * 60000 } : { count }
          return d
        })
        return { ok: false, error: 'Mobile number, email or password is incorrect.' }
      }
      if (acc.status === 'Disabled' || !acc.canSignIn) return { ok: false, error: 'This account cannot sign in. Contact your business owner.' }
      update((d) => {
        delete d.failedLogins[key]
        const a = d.accounts.find((x) => x.id === acc.id)!
        a.lastActive = 'Just now'
        if (a.status === 'Invited') a.status = 'Active'
        return d
      })
      startSession(acc.id, remember)
      return { ok: true, account: acc }
    },
    [db, update, startSession],
  )

  const signOut = useCallback(() => {
    store.set('local', SESSION_KEY, null)
    store.set('session', SESSION_KEY, null)
    store.set('session', PREVIEW_KEY, null)
    setPreviewId(null)
    setUserId(null)
  }, [])

  const sendOtp = useCallback((purpose: Otp['purpose'], targetId: string) => {
    const now = Date.now()
    const next: Otp = { purpose, targetId, code: String(Math.floor(100000 + Math.random() * 900000)), expires: now + 10 * 60000, sentAt: now, tries: 0 }
    store.set('session', OTP_KEY, JSON.stringify(next))
    setOtp(next)
  }, [])

  const signUp = useCallback(
    async (input: SignUpInput) => {
      if (!db) return { ok: false as const, errors: { form: 'Please try again in a moment.' } }
      const errors: Partial<Record<keyof SignUpInput | 'form', string>> = {}
      const email = input.email.trim().toLowerCase()
      const phone = normalizePhone(input.phone)
      if (db.accounts.some((a) => a.email.toLowerCase() === email)) errors.email = 'This email is already registered. Sign in instead?'
      if (phone && db.accounts.some((a) => a.phone === phone)) errors.phone = 'This mobile number is already registered.'
      const hourAgo = Date.now() - 3600000
      if (phone && db.signups.filter((s) => s.phone === phone && s.at > hourAgo).length >= 3) errors.form = 'Too many sign-ups from this number. Please try again in an hour.'
      if (Object.keys(errors).length || !phone) return { ok: false as const, errors }

      const account: Account = {
        id: uid('U'),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        phone,
        passwordHash: await hashPassword(input.password),
        phoneVerified: false,
        emailVerified: false,
        factoryIds: 'all',
        canSignIn: true,
        status: 'Active',
        language: 'English',
        lastActive: 'Just now',
        createdAt: new Date().toISOString(),
      }
      update((d) => {
        d.accounts.push(account)
        d.signups = [...d.signups.filter((s) => s.at > hourAgo), { phone, at: Date.now() }]
        return d
      })
      startSession(account.id, true)
      sendOtp('phone', account.id)
      return { ok: true as const }
    },
    [db, update, startSession, sendOtp],
  )

  const checkOtp = useCallback(
    (code: string): { ok: true } | { ok: false; error: string } => {
      if (!otp) return { ok: false, error: 'Please request a new code.' }
      if (otp.expires < Date.now()) return { ok: false, error: 'This code has expired. Tap Resend code.' }
      if (otp.tries >= 5) return { ok: false, error: 'Too many wrong tries. Tap Resend code.' }
      if (code !== otp.code) {
        const next = { ...otp, tries: otp.tries + 1 }
        store.set('session', OTP_KEY, JSON.stringify(next))
        setOtp(next)
        const left = 5 - next.tries
        return { ok: false, error: left > 0 ? `That code is wrong. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong tries. Tap Resend code.' }
      }
      if (otp.purpose === 'phone') {
        update((d) => {
          const a = d.accounts.find((x) => x.id === otp.targetId)
          if (a) a.phoneVerified = true
          return d
        })
      } else {
        store.set('session', ADMIN_KEY, otp.targetId)
        setAdminId(otp.targetId)
      }
      store.set('session', OTP_KEY, null)
      setOtp(null)
      return { ok: true }
    },
    [otp, update],
  )

  const verifyEmail = useCallback(() => {
    update((d) => {
      const a = d.accounts.find((x) => x.id === userId)
      if (a) a.emailVerified = true
      return d
    })
  }, [update, userId])

  const saveOnboarding = useCallback(
    (draft: OnboardingDraft) => {
      update((d) => {
        const a = d.accounts.find((x) => x.id === userId)
        if (!a) return d
        a.onboarding = draft
        // While pending, the Owner can still change the onboarding answers (2.7).
        const b = d.businesses.find((x) => x.id === a.businessId)
        if (b && b.status !== 'Active' && draft.type) {
          const typeChanged = b.type !== draft.type
          Object.assign(b, { name: draft.businessName.trim(), type: draft.type, otherTypeName: draft.otherTypeName.trim() || undefined, rawUnit: draft.rawUnit, productUnit: draft.productUnit })
          b.factories[0] = { ...b.factories[0], name: draft.factoryName.trim(), city: draft.city }
          if (typeChanged) {
            const roles = seedRoles(b.id, draft.type)
            d.roles = [...d.roles.filter((r) => r.businessId !== b.id), ...roles]
            a.roleId = roles.find((r) => r.systemKey === 'owner')!.id
          }
        }
        return d
      })
    },
    [update, userId],
  )

  const finishOnboarding = useCallback(() => {
    update((d) => {
      const a = d.accounts.find((x) => x.id === userId)
      const o = a?.onboarding
      if (!a || !o?.type || !o.rawUnit || !o.productUnit || a.businessId) return d
      const businessId = uid('biz')
      const roles = seedRoles(businessId, o.type)
      d.roles.push(...roles)
      d.businesses.push({
        id: businessId,
        name: o.businessName.trim(),
        type: o.type,
        otherTypeName: o.type === 'other' ? o.otherTypeName.trim() : undefined,
        rawUnit: o.rawUnit,
        productUnit: o.productUnit,
        status: 'Pending approval',
        ownerId: a.id,
        factories: [{ id: uid('fac'), name: o.factoryName.trim(), city: o.city }],
        hasRecords: false,
        createdAt: new Date().toISOString(),
        audit: [{ at: new Date().toISOString(), by: `${a.firstName} ${a.lastName}`, action: 'Signed up' }],
      })
      a.businessId = businessId
      a.roleId = roles.find((r) => r.systemKey === 'owner')!.id
      a.factoryIds = 'all'
      return d
    })
  }, [update, userId])

  const updateBusiness = useCallback(
    (patch: Partial<Business>) => {
      update((d) => {
        const b = d.businesses.find((x) => x.id === business?.id)
        if (!b) return d
        if (patch.type && patch.type !== b.type) {
          // New type, new starting roles. Starting roles people still hold are kept until they are moved.
          const used = new Set(d.accounts.map((a) => a.roleId))
          const kept = d.roles.filter((r) => r.businessId !== b.id || r.kind !== 'Starting' || used.has(r.id))
          const keys = new Set(kept.filter((r) => r.businessId === b.id).map((r) => r.systemKey))
          d.roles = [...kept, ...seedRoles(b.id, patch.type).filter((r) => r.kind === 'Starting' && !keys.has(r.systemKey))]
        }
        Object.assign(b, patch)
        return d
      })
    },
    [update, business?.id],
  )

  const resubmit = useCallback(() => {
    update((d) => {
      const b = d.businesses.find((x) => x.id === business?.id)
      if (b && b.status === 'Rejected') {
        b.status = 'Pending approval'
        b.statusReason = undefined
        b.audit.push({ at: new Date().toISOString(), by: 'Owner', action: 'Submitted again' })
      }
      return d
    })
  }, [update, business?.id])

  const admin = db?.admins.find((a) => a.id === adminId)

  const adminCheckPassword = useCallback(
    async (email: string, password: string) => {
      const hash = await hashPassword(password)
      return db?.admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.passwordHash === hash) ?? null
    },
    [db],
  )

  const adminSignOut = useCallback(() => {
    store.set('session', ADMIN_KEY, null)
    setAdminId(null)
  }, [])

  const setBusinessStatus = useCallback(
    (businessId: string, status: BusinessStatus, action: string, reason?: string) => {
      update((d) => {
        const b = d.businesses.find((x) => x.id === businessId)
        if (!b) return d
        b.status = status
        b.statusReason = reason
        b.audit.push({ at: new Date().toISOString(), by: admin?.name ?? 'Weftex admin', action, reason })
        return d
      })
    },
    [update, admin?.name],
  )

  const saveRole = useCallback(
    (role: Role) => {
      update((d) => {
        const i = d.roles.findIndex((r) => r.id === role.id)
        if (i >= 0) d.roles[i] = role
        else d.roles.push(role)
        return d
      })
    },
    [update],
  )

  const deleteRole = useCallback((roleId: string) => update((d) => ({ ...d, roles: d.roles.filter((r) => r.id !== roleId) })), [update])

  const saveUser = useCallback(
    (account: Account) => {
      update((d) => {
        const i = d.accounts.findIndex((a) => a.id === account.id)
        if (i >= 0) d.accounts[i] = account
        else d.accounts.push(account)
        return d
      })
    },
    [update],
  )

  const previewAs = useCallback((id: string | null) => {
    store.set('session', PREVIEW_KEY, id)
    setPreviewId(id)
  }, [])

  const value = useMemo<AccountState>(
    () => ({
      ready: !!db,
      db,
      me,
      previewedBy: previewUser ? realMe : undefined,
      business,
      role,
      profile,
      isOwner,
      can,
      seeMoney,
      landingFor,
      signIn,
      signOut,
      signUp,
      otp,
      sendOtp,
      checkOtp,
      verifyEmail,
      saveOnboarding,
      finishOnboarding,
      updateBusiness,
      resubmit,
      admin,
      adminCheckPassword,
      adminSignOut,
      setBusinessStatus,
      saveRole,
      deleteRole,
      saveUser,
      previewAs,
    }),
    [db, me, previewUser, realMe, business, role, profile, isOwner, can, seeMoney, landingFor, signIn, signOut, signUp, otp, sendOtp, checkOtp, verifyEmail, saveOnboarding, finishOnboarding, updateBusiness, resubmit, admin, adminCheckPassword, adminSignOut, setBusinessStatus, saveRole, deleteRole, saveUser, previewAs],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAccount() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider')
  return ctx
}
