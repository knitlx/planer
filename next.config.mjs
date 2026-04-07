/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ускоряет сборку и уменьшает размер бандла
  swcMinify: true,
  
  // Отключаем source maps для скорости сборки
  productionBrowserSourceMaps: false,
  
  // Уменьшаем timeout для статической генерации
  staticPageGenerationTimeout: 60,
};

export default nextConfig;
