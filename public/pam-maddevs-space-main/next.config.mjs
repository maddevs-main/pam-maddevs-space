/**
 * Minimal Next.js configuration file.
 * Kept empty so default behavior is used.
 */
const nextConfig = {
	reactStrictMode: true,
	compiler: {
		// Enable the SWC styled-components transform for SSR and better class names
		styledComponents: true,
	},
	async redirects() {
		return [
			{
				source: '/',
				destination: '/dashboard',
				permanent: true,
			},
		]
	},
};

export default nextConfig;
