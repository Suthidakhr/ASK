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
    const fetchMock = makeFetch({ items: [], last_updated: null })
    vi.stubGlobal('fetch', fetchMock)
    await api.getNews()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/news/'),
      expect.any(Object)
    )
  })

  it('includes URL-encoded category in query string', async () => {
    const fetchMock = makeFetch({ items: [], last_updated: null })
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

describe('api.getMarketSnapshot', () => {
  it('calls /market/snapshot', async () => {
    const fetchMock = makeFetch({
      indices: [],
      tickers: [{ symbol: 'SET', price: 1384.52, change_pct: 0.60, direction: 'positive' }],
      market_open: true,
      snapshot_at: '2026-06-27T03:00:00Z',
    })
    vi.stubGlobal('fetch', fetchMock)
    const result = await api.getMarketSnapshot()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/market/snapshot'),
      expect.any(Object)
    )
    expect(result.tickers[0].symbol).toBe('SET')
    expect(result.tickers[0].direction).toBe('positive')
  })
})

describe('api.getMarketSectors', () => {
  it('calls /market/sectors and returns sector list', async () => {
    const fetchMock = makeFetch([
      { sector_name: 'ก่อสร้าง', change_pct: 2.41, direction: 'positive', top_article_id: null, updated_at: '2026-06-27T03:00:00Z' },
    ])
    vi.stubGlobal('fetch', fetchMock)
    const result = await api.getMarketSectors()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/market/sectors'),
      expect.any(Object)
    )
    expect(result[0].sector_name).toBe('ก่อสร้าง')
  })
})

describe('fetchAPI error handling', () => {
  it('throws an Error with status when res.ok is false', async () => {
    const fetchMock = makeFetch({}, false)
    vi.stubGlobal('fetch', fetchMock)
    await expect(api.getNews()).rejects.toThrow('API error: 500')
  })
})
