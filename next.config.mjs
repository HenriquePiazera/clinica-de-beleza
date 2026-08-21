/** @type {import('next').NextConfig} */
// next@14.2.35 declara SWC 14.2.33; o patch do lockfile procura 14.2.35 (não publicado).
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE ??= '1'

const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
  },
}

export default nextConfig
