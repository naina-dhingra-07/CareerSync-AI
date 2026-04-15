import React from 'react';
import { motion } from 'motion/react';

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export function NavItem({ active, onClick, icon, label, badge }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative ${
        active 
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#111111]" />
        )}
      </div>
      <span className="whitespace-nowrap">{label}</span>
      {active ? (
        <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />
      ) : (
        badge && badge > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
            {badge}
          </span>
        )
      )}
    </button>
  );
}

interface MobileNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
}

export function MobileNavItem({ active, onClick, icon, badge }: MobileNavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all duration-300 relative ${
        active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-400 dark:text-gray-500'
      }`}
    >
      {icon}
      {badge && badge > 0 && (
        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#111111]">
          {badge}
        </span>
      )}
    </button>
  );
}
