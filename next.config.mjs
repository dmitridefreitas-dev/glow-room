/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Check-in photos are sent through the saveCheckIn server action. The
      // default body limit is 1MB, which a phone photo blows past — causing the
      // save to throw. Photos are also compressed in the browser first
      // (components/PhotoField.tsx), so payloads stay small; this is headroom.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
