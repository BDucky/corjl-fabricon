const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT as string

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

/**
 * Lightweight AppSync GraphQL client (fetch-based, no Amplify dependency).
 * Automatically refreshes expired tokens before sending.
 */
export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  idToken: string,
): Promise<T> {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error('VITE_GRAPHQL_ENDPOINT is not configured. Add it to .env.local')
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: idToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
  }

  const json: GraphQLResponse<T> = await response.json()

  if (json.errors?.length) {
    // Check for expired/invalid token errors
    const isAuthError = json.errors.some(
      (e) =>
        e.message.toLowerCase().includes('unauthorized') ||
        e.message.toLowerCase().includes('no federated jwt') ||
        e.message.toLowerCase().includes('token has expired'),
    )
    if (isAuthError) {
      throw new Error('SESSION_EXPIRED')
    }
    throw new Error(json.errors.map((e) => e.message).join(', '))
  }

  if (!json.data) {
    throw new Error('GraphQL response contained no data')
  }

  return json.data
}
