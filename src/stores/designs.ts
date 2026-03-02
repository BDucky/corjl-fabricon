import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { graphqlRequest } from '@/services/graphql'
import { LIST_DESIGNS_BY_ORG, GET_DESIGN } from '@/services/queries/designs'
import { useAuthStore } from '@stores/auth'
import type {
  DesignListItem,
  DesignListResponse,
  DesignDetails,
  GetDesignResponse,
  DesignType,
  DesignSortField,
  SortDirection,
} from '@/types/designs'

const CDN_URL = (import.meta.env.VITE_CDN_URL as string) || ''
const PAGE_SIZE = 50

export const useDesignsStore = defineStore('designs', () => {
  // State
  const designs = ref<DesignListItem[]>([])
  const nextToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const searchQuery = ref('')
  const designType = ref<DesignType>('COMPOSITION')
  const sortBy = ref<DesignSortField>('updatedAt')
  const sortDirection = ref<SortDirection>('DESC')

  // Detail cache
  const designDetailCache = ref<Record<string, DesignDetails>>({})

  // Computed
  const hasMore = computed(() => nextToken.value !== null)
  const isEmpty = computed(() => !isLoading.value && designs.value.length === 0)

  /** Build full CDN thumbnail URL from a relative S3 path */
  function getThumbnailUrl(filePath: string | null): string | null {
    if (!filePath) return null
    if (filePath.startsWith('http')) return filePath
    return `${CDN_URL}/${filePath}`
  }

  /** Get primary page thumbnail URL for a design detail */
  function getPrimaryPageThumbnail(detail: DesignDetails): string | null {
    if (!detail.pageMap?.length) {
      return getThumbnailUrl(detail.thumbnailFilePath)
    }
    const primary = detail.pageMap.find((p) => p.primary) ?? detail.pageMap[0]
    return getThumbnailUrl(primary.pageThumbnailFilePath ?? detail.thumbnailFilePath)
  }

  /** Get a fresh idToken, refreshing if needed */
  async function getFreshToken(): Promise<string | null> {
    const auth = useAuthStore()
    if (!auth.idToken) return null

    // Attempt refresh if token is about to expire
    try {
      await auth.refreshSession()
    } catch {
      // If refresh fails, try with the existing token anyway
    }

    return auth.idToken
  }

  /** Fetch designs list (reset=true clears existing results) */
  async function fetchDesigns(reset = true) {
    const auth = useAuthStore()
    if (!auth.idToken || !auth.orgId) {
      error.value = 'Not authenticated'
      return
    }

    if (reset) {
      designs.value = []
      nextToken.value = null
    }

    isLoading.value = true
    error.value = null

    try {
      const token = await getFreshToken()
      if (!token) {
        error.value = 'Not authenticated'
        return
      }

      const variables: Record<string, unknown> = {
        orgId: auth.orgId,
        designType: designType.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
        limit: PAGE_SIZE,
        nextToken: reset ? null : nextToken.value,
      }

      if (searchQuery.value.trim()) {
        variables.filter = {
          designName: { contains: searchQuery.value.trim() },
        }
      }

      const data = await graphqlRequest<DesignListResponse>(
        LIST_DESIGNS_BY_ORG,
        variables,
        token,
      )

      const items = data.listDesignsByOrg?.items ?? []

      if (reset) {
        designs.value = items
      } else {
        designs.value.push(...items)
      }
      nextToken.value = data.listDesignsByOrg?.nextToken ?? null
    } catch (e) {
      if (e instanceof Error && e.message === 'SESSION_EXPIRED') {
        error.value = 'Session expired. Please log in again.'
      } else {
        error.value = e instanceof Error ? e.message : 'Failed to load designs'
      }
    } finally {
      isLoading.value = false
    }
  }

  /** Load next page */
  async function loadMore() {
    if (!hasMore.value || isLoading.value) return
    await fetchDesigns(false)
  }

  /** Fetch full design detail by ID */
  async function fetchDesignDetail(designId: string): Promise<DesignDetails | null> {
    // Check cache first
    if (designDetailCache.value[designId]) {
      return designDetailCache.value[designId]
    }

    const token = await getFreshToken()
    if (!token) {
      error.value = 'Not authenticated'
      return null
    }

    try {
      const data = await graphqlRequest<GetDesignResponse>(
        GET_DESIGN,
        {
          designId,
          designVersionType: 'PUBLISHED',
        },
        token,
      )

      const detail = data.getDesign.designDetails
      designDetailCache.value[designId] = detail
      return detail
    } catch (e) {
      if (e instanceof Error && e.message === 'SESSION_EXPIRED') {
        error.value = 'Session expired. Please log in again.'
      } else {
        error.value = e instanceof Error ? e.message : 'Failed to load design details'
      }
      return null
    }
  }

  /** Update search query and re-fetch */
  function setSearch(query: string) {
    searchQuery.value = query
    fetchDesigns(true)
  }

  /** Update design type filter and re-fetch */
  function setDesignTypeFilter(type: DesignType) {
    designType.value = type
    fetchDesigns(true)
  }

  /** Update sort and re-fetch */
  function setSort(field: DesignSortField, direction: SortDirection) {
    sortBy.value = field
    sortDirection.value = direction
    fetchDesigns(true)
  }

  return {
    // State
    designs,
    nextToken,
    isLoading,
    error,
    searchQuery,
    designType,
    sortBy,
    sortDirection,

    // Computed
    hasMore,
    isEmpty,

    // Actions
    getThumbnailUrl,
    getPrimaryPageThumbnail,
    fetchDesigns,
    loadMore,
    fetchDesignDetail,
    setSearch,
    setDesignTypeFilter,
    setSort,
  }
})
