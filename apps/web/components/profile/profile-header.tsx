import { Avatar } from "@/components/boards/avatar"
import type { ProfileResponse } from "@/services/profile"

const MEMBER_SINCE_FMT = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
})

// Top of the profile page — large avatar, name, member-since, and the
// three-stat row (feedback / comments / votes). Matches the YouForm
// reference but with our own typography scale.
export function ProfileHeader({
  profile,
}: {
  profile: ProfileResponse
}) {
  const memberSince = MEMBER_SINCE_FMT.format(new Date(profile.actor.memberSince))

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        {profile.actor.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.actor.image}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <Avatar name={profile.actor.name} size={64} />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[26px] font-medium leading-tight -tracking-[0.015em] sm:text-[28px]">
            {profile.actor.name}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Member since {memberSince}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border-soft pb-5 text-[13px]">
        <Stat n={profile.totals.feedbackCount} label="feedback" />
        <Stat n={profile.totals.commentCount} label="comments" />
        <Stat n={profile.totals.voteCount} label="votes" />
      </div>
    </header>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono font-medium tabular-nums text-foreground">
        {n}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}
