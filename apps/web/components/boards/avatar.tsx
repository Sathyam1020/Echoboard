const AV_COLORS = [
  ["#E6F1FB", "#0C447C"],
  ["#FAEEDA", "#633806"],
  ["#EEEDFE", "#3C3489"],
  ["#E1F5EE", "#085041"],
  ["#FCE8E6", "#8A1F1F"],
  ["#F0EDE3", "#524A2A"],
] as const

export function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"

  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const palette = AV_COLORS[hash % AV_COLORS.length]!
  const [bg, fg] = palette

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium leading-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: bg,
        color: fg,
      }}
    >
      {initials}
    </span>
  )
}
