'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgents } from '../lib/firebase';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Tasks', href: '/tasks', icon: '✓' },
  { label: 'Agents', href: '/agents', icon: '🤖' },
  { label: 'Documents', href: '/documents', icon: '📄' },
  { label: 'Activity', href: '/activity', icon: '📡' },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { agents, loading } = useAgents();

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalCount = agents.length;

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-[#0a0a0a] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-[#ededed]">Mission Control</h1>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#ededed] p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            id="mobile-nav-menu"
            className="lg:hidden fixed top-[73px] left-0 right-0 bottom-0 bg-[#0a0a0a] z-40 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav className="p-4 space-y-1" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-[#d4a574]/10 text-[#d4a574] font-medium' 
                        : 'text-[#aaa] hover:bg-[#1a1a1a] hover:text-[#ededed]'
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    
                    {item.href === '/agents' && !loading && (
                      <span className={`
                        ml-auto text-xs px-2 py-0.5 rounded-full
                        ${isActive ? 'bg-[#d4a574]/20 text-[#d4a574]' : 'bg-[#2a2a2a] text-[#888]'}
                      `}>
                        {totalCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Agent Status in Mobile */}
            <div className="p-4 border-t border-[#2a2a2a] mt-4">
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#888] uppercase tracking-wide">
                    Agent Status
                  </span>
                </div>
                
                {!loading && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-green-500' : 'bg-[#444]'}`} />
                      <span className="text-sm text-[#ededed]">{activeCount}</span>
                    </div>
                    <span className="text-xs text-[#666]">/</span>
                    <span className="text-sm text-[#888]">{totalCount} total</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
