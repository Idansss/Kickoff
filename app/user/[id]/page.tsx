import Image from 'next/image'
import { mockUsers, mockPosts } from '@/lib/mock-data'
import { AppLayout } from '@/components/app-layout'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui/button'
import { Share2, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'User Profile - KICKOFF',
}

interface UserPageProps {
  params: Promise<{ id: string }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params
  const user = mockUsers.find((u) => u.id === id)

  if (!user) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">User not found</h1>
          </div>
        </div>
      </AppLayout>
    )
  }

  const userPosts = mockPosts.filter((p) => p.author.id === user.id)

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl border-x border-border">
        {/* Cover and Header */}
        <div className="border-b border-border">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/10"></div>

          {/* Profile Section */}
          <div className="px-4 pb-6 sm:px-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <div className="-mt-16 flex gap-4">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full border-4 border-background"
                    priority
                  />
                  <div className="flex flex-col justify-end pb-2">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">@{user.handle}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" aria-label="Open direct message">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Share user profile">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm">Follow</Button>
                </div>
              </div>

              {/* Bio */}
              {user.bio && <p className="text-foreground">{user.bio}</p>}

              {/* Stats */}
              <div className="flex gap-6 border-b border-border pb-4">
                <div>
                  <div className="text-xl font-bold">{user.following}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{user.followers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur px-4 py-4 sm:px-6">
            <h2 className="font-bold">Posts</h2>
            <p className="text-sm text-muted-foreground">{userPosts.length} posts</p>
          </div>

          {userPosts.length > 0 ? (
            <div>
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
