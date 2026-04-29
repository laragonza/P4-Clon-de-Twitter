import PostItem from './PostItem'

export default function PostsList({ posts = [] }: { posts?: any[] }) {
  return (
    <div style={{ marginTop: 12 }}>
      {posts.map((p) => <PostItem key={p._id || p.id} post={p} />)}
    </div>
  )
}