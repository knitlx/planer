"use client";

import { motion } from "framer-motion";
import type { ProjectWithMeta } from "@/types/project";
import { ArrowRight } from "lucide-react";

interface RadarCardProps {
  project: ProjectWithMeta;
  onSelect: () => void;
}

function Radar({ progress, score }: { progress: number; score: number }) {
  const size = 128;
  const center = size / 2;
  const radius = size / 2 - 8;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        className="w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
        initial="hidden"
        animate="visible"
      >
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle - 90) * (Math.PI / 180);
          return (
            <line
              key={angle}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(rad)}
              y2={center + radius * Math.sin(rad)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={8}
          stroke="url(#grad)"
          strokeWidth="2"
          style={{ transformOrigin: "center center" }}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "linear",
          }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "rgb(234 179 8)", stopOpacity: 0 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "rgb(234 179 8)", stopOpacity: 0.8 }}
            />
          </linearGradient>
        </defs>
      </motion.svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-bold text-text-primary">{score}</span>
      </div>
    </div>
  );
}

export function RadarCard({ project, onSelect }: RadarCardProps) {
  const daysSinceUpdate = project.lastActive
    ? Math.floor(
        (Date.now() - new Date(project.lastActive).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const isStale = daysSinceUpdate >= 3;

  return (
    <motion.div
      layoutId={`project-${project.id}`}
      onClick={onSelect}
      className="group relative cursor-pointer"
      whileHover="hover"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        variants={{
          hover: {
            transform: "translate(-6px, -6px)",
          },
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute inset-0 bg-accent rounded-xl"
      />

      <div className="relative p-6 card h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-text-primary">
              {project.name}
            </h3>
            {isStale && (
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="px-2 py-1 text-xs font-semibold bg-orange-500/20 text-orange-400 rounded-full"
              >
                Простаивает
              </motion.div>
            )}
          </div>

          <div className="flex items-center justify-center mb-4">
            <Radar
              progress={project.progress}
              score={project.focusScore ?? 0}
            />
          </div>

          <div className="flex justify-between text-sm text-text-secondary mb-2">
            <span>Прогресс</span>
            <span className="font-semibold text-text-primary">
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-accent h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end text-sm font-semibold text-accent">
          <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Войти в фокус
          </span>
          <ArrowRight
            size={20}
            className="transform transition-transform group-hover:translate-x-1"
          />
        </div>
      </div>
    </motion.div>
  );
}
