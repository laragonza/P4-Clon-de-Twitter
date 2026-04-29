import useSWRInfinite from 'swr/infinite'
import api from '@/api/api'

const PAGE_SIZE = 10

export default function usePosts() {
  const getKey = (pageIndex: number, previousPageData: any) => {
    const prevPosts = previousPageData?.posts || previousPageData || []
    if (previousPageData && prevPosts.length === 0) return null
    return `/home?page=${pageIndex + 1}&limit=${PAGE_SIZE}`
  }

  const { data, size, setSize, error } = useSWRInfinite(getKey, (url: string) => api.get(url).then((r) => r.data))

  const posts = (data || []).flatMap((page: any) => page.posts || page.results || page || [])
  return {
    posts,
    isLoading: !data && !error,
    loadMore: () => setSize(size + 1)
  }
}