export const API_GATEWAY_URL_MAP: Record<string, string | undefined> =
  Object.freeze({
    development: process.env.REACT_APP_API_GATEWAY_URL_DEV,
    production: process.env.REACT_APP_API_GATEWAY_URL_PROD,
    test: '/test',
  })

export const awsLambdaAddr: string = process.env.NODE_ENV
  ? API_GATEWAY_URL_MAP[process.env.NODE_ENV] || ''
  : ''

export interface CategoryMappingDescription {
  description: string
  sk: string
}

export interface CategoryMapping {
  category: string
  descriptions: Array<CategoryMappingDescription>
}

interface ActivityResponse {
  sk: string
  date: string
  category: string
  account: string
  amount: string
  description: string
}

interface ActivitiesAPIResponse {
  data: Array<ActivityResponse>
  LastEvaluatedKey: {
    sk: string
  }
}

interface GetActivitiesResponse {
  data: Array<ActivityRow>
  nextKey: string
}

export interface ActivityRow {
  id: string
  date: string
  category: string
  account: string
  amount: number
  desc: string
}

export interface Insight {
  start_date?: string
  end_date?: string
  categories: CategoryBreakdown[]
  negatives: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
}

function postCall(
  url: string,
  params: string[][] = [],
  body: string = '',
  contentType: string = 'application/json',
  auth: string = ''
): Promise<Response> {
  try {
    return fetch(
      `${awsLambdaAddr}${url}${
        params && Object.keys(params).length > 0
          ? `?${new URLSearchParams(params)}`
          : ''
      }`,
      {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          Authorization: auth,
        },
        mode: 'cors',
        body,
      }
    )
  } catch (err) {
    console.log('post error', err)
    throw err
  }
}

function getCall(
  url: string,
  auth: string,
  params: string[][] = []
): Promise<Response> {
  try {
    return fetch(
      `${awsLambdaAddr}${url}${
        params && Object.keys(params).length > 0
          ? `?${new URLSearchParams(params)}`
          : ''
      }`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        mode: 'cors',
      }
    )
  } catch (err) {
    console.log('get error', err)
    throw err
  }
}

function deleteCall(
  url: string,
  auth: string,
  params: string[][] = []
): Promise<Response> {
  try {
    return fetch(`${awsLambdaAddr}${url}?${new URLSearchParams(params)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      mode: 'cors',
    })
  } catch (err) {
    console.log('get error', err)
    throw err
  }
}

function putCall(url: string, body: string, auth: string): Promise<Response> {
  try {
    return fetch(awsLambdaAddr + url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      mode: 'cors',
      body,
    })
  } catch (err) {
    console.log('get error', err)
    throw err
  }
}

function patchCall(url: string, body: string, auth: string): Promise<Response> {
  try {
    return fetch(awsLambdaAddr + url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      mode: 'cors',
      body,
    })
  } catch (err) {
    console.log('patch error', err)
    throw err
  }
}

function serializeActivityResponse2Row(item: ActivityResponse): ActivityRow {
  const { sk, date, category, account, amount, description } = item
  return {
    id: sk,
    date,
    category,
    account,
    amount: isNaN(parseFloat(amount)) ? 0 : parseFloat(amount),
    desc: description,
  }
}

function serializeActivitiesAPIResponse(
  res: ActivitiesAPIResponse,
  sliceResult?: {
    start: number
    end: number
  }
): GetActivitiesResponse {
  const allData = sliceResult
    ? res.data.slice(sliceResult.start, sliceResult.end)
    : res.data
  return {
    data: allData.map(serializeActivityResponse2Row),
    nextKey: res.LastEvaluatedKey?.sk,
  }
}

// need another api layer to handle different api responses

export function getMappings(
  auth: string | null
): Promise<Array<CategoryMapping>> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall('/mappings', auth)
    .then(res => {
      if (res.status === 200) {
        return res.json()
      } else {
        throw new Error('get mappings failed')
      }
    })
    .then(jsonResult => {
      return jsonResult.data as Array<CategoryMapping>
    })
}

export function postMappings(
  auth: string | null,
  mapping: { description: string; category: string }
): Promise<Response> {
  if (!auth) {
    throw new Error('no auth')
  }
  return postCall(
    '/mappings',
    [],
    JSON.stringify(mapping),
    'application/json',
    auth
  )
}

export function deleteMapping(
  auth: string | null,
  id: string
): Promise<Response> {
  if (!auth) {
    throw new Error('no auth')
  }
  return deleteCall(`/mappings`, auth, [['id', id]])
}

export function getActivities(
  auth: string,
  nextKey: string | null,
  options: {
    size: number
    category?: string
    startDate?: string
    endDate?: string
  } = {
    size: 20,
  }
): Promise<GetActivitiesResponse> {
  if (!auth) {
    console.log(auth)
    throw new Error('no auth')
  }
  const urlParams: [string, string][] = [['size', options.size.toString()]]

  if (nextKey) {
    urlParams.push(['nextDate', nextKey])
  }
  if (options.category) {
    urlParams.push(['category', options.category])
  }
  if (options.startDate) {
    urlParams.push(['startDate', options.startDate])
  }
  if (options.endDate) {
    urlParams.push(['endDate', options.endDate])
  }

  return getCall('/activities', auth, urlParams)
    .then(res => {
      if (!res.ok) {
        throw new Error('get activities failed')
      } else {
        return res.json()
      }
    })
    .then(serializeActivitiesAPIResponse)
}

export function getActivitiesWithDescription(
  auth: string,
  description: string
): Promise<GetActivitiesResponse> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall(`/activities`, auth, [['description', description]])
    .then(res => {
      if (!res.ok) {
        throw new Error('get activities failed')
      } else {
        return res.json()
      }
    })
    .then(serializeActivitiesAPIResponse)
}

export function getRelatedActivities(
  auth: string,
  id: string
): Promise<GetActivitiesResponse> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall(`/activities`, auth, [['related', id]])
    .then(res => {
      if (!res.ok) {
        throw new Error('get related activities failed')
      } else {
        return res.json()
      }
    })
    .then(serializeActivitiesAPIResponse)
}

export function getDeletedActivities(
  auth: string
): Promise<GetActivitiesResponse> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall('/deleted', auth)
    .then(res => {
      if (!res.ok) {
        throw new Error('get deleted activities failed')
      } else {
        return res.json()
      }
    })
    .then(serializeActivitiesAPIResponse)
}

export function getUnmappedActivities(
  auth: string | null
): Promise<GetActivitiesResponse> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall('/activities', auth, [['isDirty', 'false']])
    .then(res => {
      if (!res.ok) {
        throw new Error('get unmapped failed')
      } else {
        return res.json()
      }
    })
    .then(serializeActivitiesAPIResponse)
}

export function postActivitiesJSON(
  auth: string,
  activities: ActivityRow[]
): Promise<Response> {
  if (!auth) {
    throw new Error('no auth')
  }
  if (activities.length === 0) {
    throw new Error('no activity to upload')
  }
  return postCall(
    '/activities',
    [],
    JSON.stringify({
      data: activities.map(activity => ({
        ...activity,
        description: activity.desc,
        amount: `${activity.amount}`,
      })),
    }),
    'application/json',
    auth
  ).then(res => {
    if (res.ok) {
      return res.json()
    } else {
      throw new Error('post activities failed')
    }
  })
}

export function previewActivities(
  auth: string,
  columnFormat: string,
  fileContent: File
): Promise<ActivityRow[]> {
  if (!auth) {
    throw new Error('no auth')
  }
  if (!fileContent) {
    throw new Error('no file')
  }
  return fileContent
    .text()
    .then(file =>
      postCall(
        `/activities`,
        [
          ['format', columnFormat],
          ['type', 'preview'],
        ],
        file,
        'text/html',
        auth
      )
    )
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error('post activities failed')
      }
    })
    .then((res: { data: { items: ActivityResponse[] } }) =>
      res.data.items.map(serializeActivityResponse2Row)
    )
}

export function deleteActivity(auth: string, id: string): Promise<Response> {
  if (!auth) {
    throw new Error('no auth')
  }
  return deleteCall(`/activities`, auth, [['sk', id]])
}

export function patchActivity(auth: string, id: string, updateActivity: Partial<ActivityRow>) {
  const { category , desc } = updateActivity
  return patchCall(`/activities?sk=${id}`, JSON.stringify({ 
    ...(category ? { category }: {}),
    ...(desc ? { description: desc }: {}) 
  }), auth)
}

export interface FileUpload {
  checksum: string
  end_date: string
  start_date: string
}

export function getUploads(
  auth: string | null,
  limit: number
): Promise<Array<FileUpload>> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall('/chksums', auth, [['size', `${limit}`]])
    .then(res => {
      if (res.status === 200) {
        return res.json()
      } else {
        throw new Error('get checksums failed')
      }
    })
    .then(jsonResult => {
      return jsonResult.data as Array<FileUpload>
    })
}

export function getInsights(
  auth: string | null,
  startDate?: string,
  categories?: string[]
): Promise<Array<Insight>> {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall('/insights', auth, [
    // TODO: support multiple categories?
    categories ? ['categories', categories[0]] : ['all_categories', 'true'],
    // ['exclude_negative', 'false'],
    ['by_month', 'true'],
    ['starting_date', startDate ?? '2023-01-01'],
  ])
    .then(res => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error('get insights failed')
      }
    })
    .then(jsonResult => {
      const { data } = jsonResult
      return data.map(
        (insight: {
          categories: {
            category: string
            amount: string
          }[]
        }) => {
          return {
            ...insight,
            categories: insight.categories.map(({ category, amount }) => {
              return {
                category,
                amount: parseFloat(amount),
              }
            }),
          }
        }
      )
    })
}

export function getActivitiesByCategory(
  auth: string,
  categories: string[],
  exclude: boolean = false,
  options?: {
    startDate?: string
    endDate?: string
  }
): Promise<GetActivitiesResponse> {
  if (!auth) {
    throw new Error('no auth')
  }
  const urlParams = [...categories.map(cat => ['category', cat]), ['size', '5']]

  if (exclude) {
    urlParams.push(['exclude', 'true'])
  }
  if (options?.startDate) {
    urlParams.push(['startDate', options.startDate])
  }
  if (options?.endDate) {
    urlParams.push(['endDate', options.endDate])
  }
  return getCall(`/activities`, auth, urlParams)
    .then(res => {
      if (!res.ok) {
        throw new Error('get activities failed')
      } else {
        return res.json()
      }
    })
    .then(obj => serializeActivitiesAPIResponse(obj, { start: 0, end: 5 }))
}

export interface WishListItem {
  id?: string
  name: string
  price: number
  url: string
  description: string
}

export function getWishlist(auth: string | null = null) {
  if (!auth) {
    throw new Error('no auth')
  }
  return getCall('/wishlist', auth)
    .then(res => {
      if (res.status === 200) {
        return res.json()
      } else {
        throw new Error('get wishlist failed')
      }
    })
    .then(jsonResult => {
      return jsonResult.data as Array<WishListItem>
    })
}

export function deleteWishlistItem(auth: string | null = null, id: string) {
  if (!auth) {
    throw new Error('no auth')
  }
  return deleteCall(`/wishlist`, auth, [['id', id]])
}

export function addWishlistItem(
  auth: string | null = null,
  item: WishListItem
) {
  if (!auth) {
    throw new Error('no auth')
  }
  return postCall(
    '/wishlist',
    [],
    JSON.stringify(item),
    'application/json',
    auth
  )
}

export function updateWishlistItem(
  auth: string | null = null,
  item: WishListItem
) {
  if (!auth) {
    throw new Error('no auth')
  }
  return putCall('/wishlist', JSON.stringify(item), auth)
}
