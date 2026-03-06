"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Plus, 
  Zap, 
  Activity, 
  Target, 
  Brain,
  MoreVertical,
  Clock,
  ArrowRight
} from "lucide-react";

// Mock Data (Simulating Real Store Data)
const MOCK_PROJECTS = [
  { id: 1, title: "Редезайн сайта", progress: 75, priority: "high", tasks: 12, completed: 9 },
  { id: 2, title: "Маркетинг план Q3", progress: 30, priority: "medium", tasks: 8, completed: 2 },
  { id: 3, title: "MVP Мобильного приложения", progress: 10, priority: "high", tasks: 24, completed: 2 },
  { id: 4, title: "Найм команды", progress: 100, priority: "low", tasks: 5, completed: 5 },
  { id: 5, title: "Ремонт офиса", progress: 0, priority: "low", tasks: 0, completed: 0 },
];

const MOCK_STATS = {
  active: 3,
  completed: 12,
  focusHours: 4.5,
};

export default function CompactDashboard() {
  // This component will be rendered INSIDE the existing layout (Sidebar is already there)
  
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Compact Header & Stats Row */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Обзор дня</h1>
          <p className="text-qf-text-secondary text-sm">Ваша продуктивность на сегодня</p>
        </div>
        
        {/* Compact Stats Inline */}
        <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <CompactStat label="В работе" value={MOCK_STATS.active} icon={<LayoutDashboard className="w-4 h-4 text-cyan-400" />} />
          <CompactStat label="Завершено" value={MOCK_STATS.completed} icon={<CheckSquare className="w-4 h-4 text-green-400" />} />
          <CompactStat label="Часы фокуса" value={MOCK_STATS.focusHours + "ч"} icon={<Clock className="w-4 h-4 text-purple-400" />} />
        </div>
      </div>

      {/* 2. Main Action Area: Quick Collect & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Collect - Prominent but compact */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative flex items-center bg-[#0F0F14] border border-white/10 rounded-xl p-1.5 pl-4 shadow-xl">
            <Zap className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              type="text" 
              placeholder="Быстрая мысль или задача... (Cmd+K)" 
              className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 focus:outline-none h-10"
            />
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Сохранить
            </button>
          </div>
        </div>

        {/* Quick Focus Button */}
        <button className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-white/10 hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Brain className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">Быстрый фокус</div>
              <div className="text-xs text-gray-400">Войти в поток</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 3. Two-Column Layout for Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Projects (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Активные проекты
            </h2>
            <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              Все проекты <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Project Button */}
            <button className="flex flex-col items-center justify-center h-[160px] border border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all group text-gray-400 hover:text-cyan-400">
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Новый проект</span>
            </button>

            {/* Project Cards */}
            {MOCK_PROJECTS.map((project) => (
              <CompactProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Right Column: Widgets (1/3 width) */}
        <div className="space-y-6">
          
          {/* Priority Tasks Widget */}
          <div className="bg-[#161623]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-gray-400 tracking-wide mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              В приоритете
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className={`mt-1.5 w-2 h-2 rounded-full ${i === 1 ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'bg-cyan-400'}`} />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {i === 1 ? "Подготовить отчет для инвесторов" : i === 2 ? "Обновить UI кит" : "Синхронизация с командой"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {i === 1 ? "MVP Приложения" : "Редезайн сайта"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs font-medium text-gray-400 hover:text-white border border-white/5 rounded-lg hover:bg-white/5 transition-all">
              Показать все задачи
            </button>
          </div>

          {/* System Status / Mini Info */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400">Система стабильна</span>
            </div>
            <p className="text-xs text-gray-500">
              Все показатели в норме. Следующая цель: завершить 2 задачи из проекта «Редезайн сайта».
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Compact Components ---

function CompactStat({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#161623]/80 border border-white/5 rounded-xl min-w-[140px]">
      <div className="p-2 rounded-lg bg-white/5">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white leading-none">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function CompactProjectCard({ project }: any) {
  return (
    <div className="bg-[#161623]/80 border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-[160px] flex flex-col justify-between relative overflow-hidden">
      {/* Background Gradient Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 mr-2">
            <h3 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors line-clamp-1">{project.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                project.priority === 'high' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' :
                project.priority === 'medium' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' :
                'bg-gray-500/20 text-gray-300 border border-gray-500/20'
              }`}>
                {project.priority === 'high' ? 'Высокий' : project.priority === 'medium' ? 'Средний' : 'Низкий'}
              </span>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{project.completed}/{project.tasks} задач</span>
          <span className="text-cyan-400 font-mono">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
