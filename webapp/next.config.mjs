/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "v0.blob.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/course/:courseId/:examId/:sessionId/get-submissions",
        destination: "http://localhost:8000/course/:courseId/:examId/:sessionId/get-submissions", 
      },
    ];
  },
};

export default nextConfig;
