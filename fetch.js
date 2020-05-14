const FETCH_RETRIES = 3

class Exception {
  constructor(message) {
    this.message = message
    this.name = "Exception"
  }
}

class AuthException extends Exception {
  constructor(message) {
    super(message)
    this.name = "AuthException"
  }
}

class FetchException extends Exception {
  constructor(message) {
    super(message)
    this.message = message
    this.name = "FetchException"
    this.retries = 0
  }
}

const _fetchAsync = async (url, options) => {
  try {
    return await fetch(url, options)
  } catch (e) {
    if (e instanceof TypeError && (e.message === "Failed to fetch" || e.message === "NetworkError when attempting to fetch resource." || e.message === "The network connection was lost.")) {
      console.error(e)
      throw new FetchException("Slow connection to server. Check you internet connection just in case.")
    } else {
      throw e
    }
  }
}

const _fetchWithRetryAsync = async (url, options, n) => {
  let error
  for (let i = 0; i < n; i++) {
      try {
          return await _fetchAsync(url, options)
      } catch (err) {
          // error.retries = i
          error = err
      }
  }
  throw error
}

const _checkFetchErrorAsync = async (r) => {
  if (r.status === 401) {
    throw new AuthException()
  } else if (!r.ok) { // if (r.status === 503 || r.status === 500 || r.status === 400) {
    try {
      var t = await r.text()
      var o = JSON.parse(t)
    }
    catch (e) {
      // hide error from parsing
    }
    if (o && typeof o === "object") {
      throw o
    } else {
      throw Error(t)
    }
  }
  return r
}

const _fetchOptions = (method, body = {}) => {
  if (!body) {
    body = {}
  }
  let headers = new Headers({ 'Content-Type': 'application/json' })
  return {
    method,
    headers,
    body: JSON.stringify(body)
  }
}

const _fetchOptionsWithBearerForGet = (accessToken) => { // _getHeaders
  if (!accessToken) {
    throw Error(`missing access token`)
  }
  let headers = new Headers({ 'Authorization': `Bearer ${accessToken}` })
  return { headers }
}

const _fetchOptionsWithBearer = (method, accessToken, body) => {
  if (!accessToken) {
    throw Error(`missing access token`)
  }
  let headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` })
  return {
    method,
    headers,
    body: JSON.stringify(body)
  }
}

const _fetchTextAsync = async (url, options) => {
  const r = await _fetchAsync(url, options)
  const response = await _checkFetchErrorAsync(r)
  return await response.text()
}

const _fetchJsonAsync =  async (url, options) => {
  const r = await _fetchAsync(url, options)
  const response = await _checkFetchErrorAsync(r)
  return await response.json()
}

const _fetchTextWithRetryAsync =  async (url, options) => {
  const r = await _fetchWithRetryAsync(url, options, FETCH_RETRIES)
  const response = await _checkFetchErrorAsync(r)
  return await response.text()
}

const _fetchJsonWithRetryAsync =  async (url, options) => {
  const r = await _fetchWithRetryAsync(url, options, FETCH_RETRIES)
  const response = await _checkFetchErrorAsync(r)
  return await response.json()
}

export { _fetchJsonAsync, _fetchTextAsync, _fetchOptionsWithBearer, _fetchOptionsWithBearerForGet, _fetchJsonWithRetryAsync, _fetchTextWithRetryAsync, AuthException, FetchException, _fetchOptions }

