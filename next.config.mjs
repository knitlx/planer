/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ускоряет сборку и уменьшает размер
  swcMinify: true,
  
  // Отключаем source maps для скорости сборки
  productionBrowserSourceMaps: false,
  
  // Standalone output - быстрее стартует на VPS
  output: 'standalone',
};

export default nextConfig;
