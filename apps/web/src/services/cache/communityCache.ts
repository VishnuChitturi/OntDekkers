/**
 * OntDekker — Community Cache Keys
 *
 * SWR key factories for the Community domain.
 */

/** Communities */
export const communityKeys = {
  list: (params: Record<string, unknown> = {}) =>
    ["/communities/api/v1/communities", params] as [string, Record<string, unknown>],
  byId: (id: string) => `/communities/api/v1/communities/${id}`,
  members: (id: string, page = 1) =>
    `/communities/api/v1/communities/${id}/members?page=${page}`,
  discussions: (id: string, page = 1) =>
    `/communities/api/v1/communities/${id}/discussions?page=${page}`,
} as const;
