export const awsLambdaAddr =
  'https://6idb1tvzk8.execute-api.us-east-1.amazonaws.com/Test';

interface CategoryMapping {
  sk: string;
  category: string;
  description: string;
}

interface ActivityResponse {
  sk: string;
  date: string;
  category: string;
  account: string;
  amount: string;
  description: string;
}

interface ActivitiesAPIResponse {
  data: Array<ActivityResponse>;
  LastEvaluatedKey: {
    sk: string;
  };
}

interface ActivityRow {
  id: string;
  date: string;
  category: string;
  account: string;
  amount: number;
  desc: string;
}

interface GetActivitiesResponse {
  data: Array<ActivityRow>;
  nextKey: string;
}

interface ChksumItem {
  chksum: string;
}

export interface Insight {
  date: string;
  categories: Record<string, number>;
}

function postCall(
  url: string,
  body: string = '',
  contentType: string = 'application/json',
  auth: string = ''
): Promise<Response> {
  try {
    return fetch(awsLambdaAddr + url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: auth,
      },
      mode: 'cors',
      body,
    });
  } catch (err) {
    console.log('post error', err);
    throw err;
  }
}

function getCall(url: string, auth: string): Promise<Response> {
  try {
    return fetch(awsLambdaAddr + url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      mode: 'cors',
    });
  } catch (err) {
    console.log('get error', err);
    throw err;
  }
}

function deleteCall(url: string, auth: string): Promise<Response> {
  try {
    return fetch(awsLambdaAddr + url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      mode: 'cors',
    });
  } catch (err) {
    console.log('get error', err);
    throw err;
  }
}

function serializeActivitiesAPIResponse(
  res: ActivitiesAPIResponse,
  sliceResult?: {
    start: number;
    end: number;
  }
): GetActivitiesResponse {
  const allData = sliceResult
    ? res.data.slice(sliceResult.start, sliceResult.end)
    : res.data;
  return {
    data: allData.map(
      ({
        sk,
        date,
        category,
        account,
        amount,
        description,
      }: ActivityResponse) => {
        return {
          id: sk,
          date,
          category,
          account,
          amount: isNaN(parseFloat(amount)) ? 0 : parseFloat(amount),
          desc: description,
        };
      }
    ),
    nextKey: res.LastEvaluatedKey.sk,
  };
}

// need another api layer to handle different api responses

export function getMappings(
  auth: string | null
): Promise<Array<CategoryMapping>> {
  if (!auth) {
    throw new Error('no auth');
  }
  return getCall('/mappings', auth)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        throw new Error('get mappings failed');
      }
    })
    .then((jsonResult) => {
      return jsonResult.data as Array<CategoryMapping>;
    });
}

export function postMappings(
  auth: string | null,
  mapping: { description: string; category: string }
): Promise<Response> {
  if (!auth) {
    throw new Error('no auth');
  }
  return postCall(
    '/mappings',
    JSON.stringify(mapping),
    'application/json',
    auth
  );
}

export function deleteMapping(
  auth: string | null,
  id: string
): Promise<Response> {
  if (!auth) {
    throw new Error('no auth');
  }
  return deleteCall(`/mappings?id=${id}`, auth);
}

export function getActivities(
  auth: string,
  nextKey: string | null
): Promise<GetActivitiesResponse> {
  if (!auth) {
    console.log(auth);
    throw new Error('no auth');
  }
  return getCall(
    `/activities?size=20${nextKey ? `&nextDate=${nextKey}` : ''}`,
    auth
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error('get activities failed');
      } else {
        return res.json();
      }
    })
    .then(serializeActivitiesAPIResponse);
}

export function postActivities(
  auth: string,
  columnFormat: string,
  fileContent: File
): Promise<Response> {
  if (!auth) {
    throw new Error('no auth');
  }
  if (!fileContent) {
    throw new Error('no file');
  }
  return fileContent
    .text()
    .then((file) =>
      postCall(`/activities?format=${columnFormat}`, file, 'text/html', auth)
    )
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('post activities failed');
      }
    });
}

export function deleteActivity(auth: string, id: string): Promise<Response> {
  if (!auth) {
    throw new Error('no auth');
  }
  return deleteCall(`/activities?sk=${id}`, auth);
}

export function getChecksums(auth: string | null): Promise<Array<string>> {
  if (!auth) {
    throw new Error('no auth');
  }
  return getCall('/chksums', auth)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        throw new Error('get checksums failed');
      }
    })
    .then((jsonResult) => {
      return jsonResult.data.map(
        (item: ChksumItem) => item.chksum
      ) as Array<string>;
    });
}

export function getInsights(auth: string | null): Promise<Array<Insight>> {
  if (!auth) {
    throw new Error('no auth');
  }
  return getCall('/insights', auth)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error('get insights failed');
      }
    })
    .then((jsonResult) => {
      const { data } = jsonResult;
      return data.map(
        ({ date, categories }: { date: string; categories: string }) => {
          const categoriesObj = JSON.parse(categories);
          return {
            date,
            categories: Object.keys(categoriesObj).reduce((acc, category) => {
              return {
                ...acc,
                [category]: parseFloat(categoriesObj[category]),
              };
            }, {}),
          };
        }
      ) as Array<Insight>;
    });
}

export function getActivitiesByCategory(
  auth: string,
  category: string
): Promise<GetActivitiesResponse> {
  if (!auth) {
    throw new Error('no auth');
  }
  return getCall(`/activities?category=${category}&size=5`, auth)
    .then((res) => {
      if (!res.ok) {
        throw new Error('get activities failed');
      } else {
        return res.json();
      }
    })
    .then((obj) => serializeActivitiesAPIResponse(obj, { start: 0, end: 5 }));
}
