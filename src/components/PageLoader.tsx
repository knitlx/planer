"use client";

import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500"
        >
          Загрузка...
        </motion.p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
        </div>

        <div className="flex items-center justify-center my-6">
          <div className="w-32 h-32 rounded-full border-8 border-slate-100 animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
        </div>

        <div className="mt-6 h-10 w-24 bg-slate-100 rounded-lg animate-pulse ml-auto" />
      </div>
    </motion.div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
