'use client';

import { Calculator, Scale, Briefcase, Landmark, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AgentType = 'auto' | 'financial' | 'tax' | 'legal' | 'commercial';

interface Props {
  selected: AgentType;
  onChange: (agent: AgentType) => void;
  disabled?: boolean;
}

const AGENTS = [
  { id: 'auto' as AgentType, label: 'Auto', icon: Sparkles, desc: 'Detección automática', color: 'from-purple-500 to-pink-500' },
  { id: 'financial' as AgentType, label: 'Financiero', icon: Calculator, desc: 'DCF, ratios, valuación', color: 'from-blue-500 to-cyan-500' },
  { id: 'tax' as AgentType, label: 'Tributario', icon: Landmark, desc: 'SRI, IVA, Renta', color: 'from-orange-500 to-red-500' },
  { id: 'legal' as AgentType, label: 'Legal', icon: Scale, desc: 'Contratos, compliance', color: 'from-green-500 to-emerald-500' },
  { id: 'commercial' as AgentType, label: 'Comercial', icon: Briefcase, desc: 'Pipeline, leads, CRM', color: 'from-yellow-500 to-orange-500' },
];

export function AgentSelector({ selected, onChange, disabled }: Props) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {AGENTS.map((agent) => {
        const Icon = agent.icon;
        const isSelected = selected === agent.id;
        return (
          <Button
            key={agent.id}
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(agent.id)}
            disabled={disabled}
            title={agent.desc}
            className={cn('h-8 px-2 gap-1.5', isSelected && `bg-gradient-to-r ${agent.color} text-white`)}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">{agent.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
