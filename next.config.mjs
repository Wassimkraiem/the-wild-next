/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'gitczylgzrkoakcgxizh.supabase.co',
				port: '',
				pathname: '/storage/v1/object/public/cabins/**',
			},
		],
	},
	// output: 'export',
};

export default nextConfig;
