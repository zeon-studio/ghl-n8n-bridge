const API_BASE_URL = 'https://services.leadconnectorhq.com';

function getAppVersionId() {
  const versionId = process.env.GHL_APP_VERSION_ID;
  if (!versionId) throw new Error('Missing GHL_APP_VERSION_ID environment variable');
  return versionId;
}

/**
 * Makes an authenticated request to the GHL API.
 */
export async function ghlFetch(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
) {
  // Ensure endpoint starts with slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const url = new URL(`${API_BASE_URL}${path}`);
  // Constraints: ALL token requests MUST append version_id
  // We append it to API calls as well just to be safe, though usually required for token endpoints
  url.searchParams.append('version_id', getAppVersionId());

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Version', '2021-07-28');
  headers.set('Accept', 'application/json');

  const res = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`GHL API Error: ${res.status} ${errorData}`);
  }

  return res;
}
