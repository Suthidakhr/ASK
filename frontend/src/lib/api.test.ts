import { api } from './api'

const makeFetch = (data: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.getNews', () => {
  it('calls fetch with /news/ path when no category given', async () => {
    const fetchMock = makeFetch([])
    vi.stubGlobal('fetch', fetchMock)
    await api.getNews()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/news/'),
      expect.any(Object)
    )
  })

  it('includes URL-encoded category in query string', async () => {
    const fetchMock = makeFetch([])
    vi.stubGlobal('fetch', fetchMock)
    await api.getNews('พลังงาน')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('พลังงาน')),
      expect.any(Object)
    )
  })
})

describe('api.getNewsById', () => {
  it('calls fetch with /news/{id} path', async () => {
    const fetchMock = makeFetch({ id: 'news-001' })
    vi.stubGlobal('fetch', fetchMock)
    await api.getNewsById('news-001')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/news/news-001'),
      expect.any(Object)
    )
  })
})

describe('api.getCategories', () => {
  it('calls /news/categories and returns unwrapped categories array', async () => {
    const fetchMock = makeFetch({ categories: ['พลังงาน', 'เทคโนโลยี'] })
    vi.stubGlobal('fetch', fetchMock)
    const result = await api.getCategories()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/news/categories'),
      expect.any(Object)
    )
    expect(result).toEqual(['พลังงาน', 'เทคโนโลยี'])
  })
})

describe('api.getMarketOverview', () => {
  it('calls /market/overview', async () => {
    const fetchMock = makeFetch({})
    vi.stubGlobal('fetch', fetchMock)
    await api.getMarketOverview()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/market/overview'),
      expect.any(Object)
    )
  })
})

describe('api.getTicker', () => {
  it('calls /market/ticker and returns unwrapped ticker array', async () => {
    const fetchMock = makeFetch({ ticker: [{ symbol: 'SET', price: 1384.52, change: 8.21, change_pct: 0.60 }] })
    vi.stubGlobal('fetch', fetchMock)
    const result = await api.getTicker()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/market/ticker'),
      expect.any(Object)
    )
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].symbol).toBe('SET')
  })
})

describe('fetchAPI error handling', () => {
  it('throws an Error with status when res.ok is false', async () => {
    const fetchMock = makeFetch({}, false)
    vi.stubGlobal('fetch', fetchMock)
    await expect(api.getNews()).rejects.toThrow('API error: 500')
  })
})
