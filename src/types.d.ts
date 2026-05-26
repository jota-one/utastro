export type BlockSpaceSize = 'full' | 'half' | 'quarter'
export type Coords = [number, number]
export interface CenterCoords {
  lat: number
  lng: number
}

export interface DateRange {
  from: Dayjs
  to: Dayjs
}

export interface Link {
  label: string
  href: string
}

export interface Marker {
  coords: Coords
  icon: string
  label: string
  slug?: string
}

export type ColorTheme = 'error' | 'info' | 'warning' | 'success' | 'neutral' | 'subscribed'
export type LangCode = 'fr' | 'de' | 'en' | 'it' | 'es' | 'pt'
export type I18nField = Record<LangCode, string>

export interface Page {
  id: number
  name: string
  label: string
  sort: number
  show: ShowPage
  access: string
  lang: string
  path: string
  resolveSlug?: string
}

export interface Tag {
  id: number
  label: string
}

export interface Teaser {
  id?: number
  activeFrom?: string
  activeUntil?: string
  tags?: Tag[]
  title?: string
  description?: string
  imageUrl?: string
  link?: Link
  displayTargets: Array<{
    pageId: number
    slugValue?: string
  }>
}

export interface TargetSelectorPage {
  id?: number
  name: string
  isDynamic?: boolean
  path: string
}

export interface PageSelectorModel {
  page?: TargetSelectorPage
  slugValue?: string
}

export interface TeaserAdminModel {
  id?: number
  activeFrom?: string
  activeUntil?: string
  source: Record<LangCode, PageSelectorModel>
  title: I18nField
  description: I18nField
  linkLabel: I18nField
  imageUrl: I18nField
  displayTargets: PageSelectorModel[]
}

export interface TeaserLangRecord {
  teaser_id: number
  title: string
  description: string
  link_label: string
  image_url: string
  lang_id: number
}

export interface TeaserListItemAdminModel extends TeaserAdminModel {
  source: Record<LangCode, PageSelectorModel>
}

export type Sponsor = {
  id: number
  name: string
  title?: string
  isGlobal: boolean
  bgColor?: string
}

export type SponsorWithDetail = Sponsor & {
  content: any[]
  link?: Link
}

export interface City {
  id: number
  label: string
  coords: Coords
  slug: string
  sponsors: number[]
}

export interface SessionLocation {
  label: string
  coords: Coords
  address: string
}

export interface SessionSubscriptions {
  starting?: Date
  max: number
  currentCount: number
  staffCount: number
}

export type SessionAttendeesStatus = 'todo' | 'checked' | 'disabled'

export interface Session {
  id: number
  title: string
  location: SessionLocation
  cityId: number
  start: Date
  end?: Date
  subscriptions: SessionSubscriptions
  tags: Tag[]
  moreInfo?: string
  paused: string | null
  cancelled: string | null
  attendees: SessionAttendeesStatus
}

export type DateRangeSize = 'day' | 'week' | 'month' | 'year'

export interface CaptchaModel {
  verified: boolean
  expired: boolean
  token: string
  eKey: string
  error: string
  isValid: boolean
}

export interface Person {
  firstName: string
  lastName: string
  street: string
  zip?: number
  city: string
  phone: string
  email: string
  title?: string
}

export interface Attendee {
  subscriptionId: number
  presence: boolean | null
  firstName: string
  lastName: string
  gender: 'male' | 'female' | 'other'
}

export type UserProfileLogin = {
  email: string
  password?: string
  passwordConfirm?: string
}

export type UserProfileDetails = {
  firstName: string
  lastName: string
  street: string
  zip?: number
  city: string
  regionId?: number
  country?: string
  phone?: string
  gender: string
  birthdate: number
}

export type UserProfileAgreements = {
  risks?: boolean
  promo?: boolean
}

export type UserProfile = UserProfileLogin &
  UserProfileDetails &
  UserProfileAgreements & {
    id: number
  }

export interface EventType {
  id?: number
  xid: string
  label: I18nField
}

export interface EventsImportResponse {
  nbEvents: number
  inserted: Array<number>
  duplicates: Array<number>
}

export interface HateoasLinkDef {
  href: string
}
export interface HateoasResource {
  id: number
  _links: Record<string, HateoasLinkDef>
}
