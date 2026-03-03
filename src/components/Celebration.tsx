"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

interface CelebrationProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

export function Celebration({
  isVisible,
  title = "Поздравляем! 🎉",
  message = "Проект завершён!",
  onClose,
}: CelebrationProps) {
  const [particles, setParticles] = useState<
    { id: number; x: number; color: string }[]
  >([]);

  useEffect(() => {
    if (isVisible) {
      const colors = ["#8A2BE2", "#00E5FF", "#6EEFFF", "#A855F7", "#22D3EE", "#C084FC"];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onClose();
        setParticles([]);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}vw`,
                y: -20,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                y: "120vh",
                scale: [0, 1, 1, 0],
                rotate: 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                ease: "easeOut",
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative quantum-glass rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 border border-qf-border-primary"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="w-20 h-20 mx-auto mb-4 bg-qf-gradient-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold gradient-text mb-2"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-qf-text-secondary mb-4"
            >
              {message}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-sm text-qf-text-muted"
            >
              <Sparkles className="w-4 h-4" />
              <span>Отличная работа!</span>
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useCelebration() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    title?: string;
    message?: string;
  }>({});

  const celebrate = (title?: string, message?: string) => {
    setCelebrationData({ title, message });
    setShowCelebration(true);
  };

  const closeCelebration = () => {
    setShowCelebration(false);
  };

  return { showCelebration, celebrationData, celebrate, closeCelebration };
}
