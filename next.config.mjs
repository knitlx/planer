/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ускоряет сборку и уменьшает размер
  swcMinify: true,
  
  // Отключаем source maps для скорости сборки
  productionBrowserSourceMaps: false,
  
  // Standalone output - быстрее стартует на VPS
  output: 'standalone',
  
  // Отключаем статическую генерацию для динамических страниц
  // Это сильно ускоряет сборку
  staticPageGenerationTimeout: 60,
  
  // Experimental: отключаем проверку типов во время сборки
  // (у тебя уже есть отдельный lint + tsc в CI)
  typescript: {
    ignoreBuildErrors: false, // мы убрали ранее, но можно включить если lint проходит
  },
  
  // Кэширование
  onDemandEntries: {
    // Уменьшаем время жизни кэша на dev
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
