export interface CookieOptions {
  /**
   * 有効期限。\
   * 単位は「分」。
   */
  expires?: number | Date

  /**
   * アクセスを許可するパス。\
   * 指定しない場合、サイトを開いているページのパスでのみ有効になる。
   */
  path?: string

  /**
   * アクセスを許可するドメイン。\
   * 指定しない場合、サイトを開いているページのドメインでのみ有効になる。
   */
  domain?: string

  /**
   * Secure 属性を付与するかどうか。\
   * Secure 属性を付与すると、HTTPS でのみクッキーが送信されるようになる。
   */
  secure?: boolean

  /**
   * SameSite 属性を付与するかどうか。\
   * SameSite 属性を付与すると、クロスサイトリクエスト時にクッキーが送信されなくなる。
   *
   * - `strict`: クロスサイトリクエスト時にクッキーが送信されない。
   * - `lax`: GET リクエスト以外のクロスサイトリクエスト時にクッキーが送信されない。
   * - `none`: クロスサイトリクエスト時にクッキーが送信される。
   */
  sameSite?: 'strict' | 'lax' | 'none'
}

function createExpires(expires: NonNullable<CookieOptions['expires']>) {
  if (typeof expires !== 'number') {
    return expires.toUTCString()
  }

  if (expires === Infinity) {
    return 'Fri, 01 Jan 2038 00:00:00 UTC'
  }

  const date = new Date()
  date.setTime(date.getTime() + expires * 60 * 1000)
  return date.toUTCString()
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  let cookie = `${name}=${value};`

  if (options.path) cookie += `path=${options.path};`
  if (options.domain) cookie += `domain=${options.domain};`
  if (options.secure) cookie += 'secure;'
  if (options.expires) cookie += `expires=${createExpires(options.expires)};`
  if (options.sameSite) cookie += `sameSite=${options.sameSite};`

  document.cookie = cookie
}

export function getCookie(name: string) {
  const value = '; ' + document.cookie
  const parts = value.split('; ' + name + '=')

  if (parts.length !== 2) return null
  return parts.pop()!.split(';').shift() || null
}

export function deleteCookie(
  name: string,
  options: Pick<CookieOptions, 'path' | 'domain'> = {}
) {
  let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`

  if (options.path) cookie += `path=${options.path};`
  if (options.domain) cookie += `domain=${options.domain};`

  document.cookie = cookie
}
