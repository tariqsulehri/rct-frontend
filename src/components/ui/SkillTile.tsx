import React from 'react';
import { ScoreDisplay } from './ScoreDisplay';
import { Lightbulb, TrendingUp, Medal } from 'lucide-react';
import { InfoTip } from '@/components/ui/InfoTip';
import { IconBadge } from '@/components/ui/IconBadge';
import { clampPct } from '@/lib/formatters';

export interface SkillTileProps {
  name: string;
  domain: string;
  score: number;
  required: number;
  isCritical: boolean;
  meets: boolean;
  hasRequirement: boolean;
  momentum?: number;
  percentile?: number;
}

export const SkillTile: React.FC<SkillTileProps> = ({
  name,
  domain,
  score,
  required,
  isCritical,
  meets,
  hasRequirement,
  momentum,
  percentile,
}) => {
  // Convert 0-100 score to 0-5 stars
  const getStars = (pct: number) => {
    const rawStars = Math.round((pct / 100) * 5);
    const starCount = Math.max(0, Math.min(5, rawStars));
    return `${'★'.repeat(starCount)}${'☆'.repeat(5 - starCount)}`;
  };

  const gap = hasRequirement ? required - score : 0;
  const isSevereGap = hasRequirement && gap >= 40;
  const isMastered = hasRequirement && meets;

  // Determine border, sizing, and premium 3D glassmorphic background
  let containerClasses = 'rounded-xl p-4 transition-all duration-300 flex flex-col justify-between border relative ';
  let shadow = 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_4px_12px_rgba(0,0,0,0.3)]';
  let scale = 'scale-100';
  let borderStyle: React.CSSProperties = { borderColor: 'rgb(var(--border))', backgroundColor: 'rgba(var(--surface), 0.7)' };

  // Radial Glow effect for premium depth (increased opacity for better visibility)
  const radialGlow = isSevereGap
    ? 'radial-gradient(circle at top right, rgba(var(--danger), 0.35), transparent 80%)'
    : isMastered
    ? 'radial-gradient(circle at top right, rgba(var(--success), 0.25), transparent 80%)'
    : 'radial-gradient(circle at top right, rgba(var(--accent), 0.15), transparent 80%)';

  borderStyle.backgroundImage = radialGlow;

  if (isSevereGap) {
    containerClasses += 'z-10 backdrop-blur-xl ';
    borderStyle.borderColor = 'rgb(var(--danger))';
    borderStyle.backgroundColor = 'rgba(var(--danger), 0.03)'; // Subtle red tint wash
    shadow = 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_8px_20px_rgba(var(--danger),0.15)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_12px_25px_rgba(var(--danger),0.25)]';
    scale = 'hover:-translate-y-1 transform';
  } else if (isMastered) {
    containerClasses += 'opacity-90 backdrop-blur-sm ';
    borderStyle.borderColor = 'rgba(var(--success), 0.5)';
    borderStyle.backgroundColor = 'rgba(var(--success), 0.02)'; // Subtle green tint wash
    shadow = 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_4px_10px_rgba(var(--success),0.1)]';
    scale = 'hover:-translate-y-0.5 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),_0_8px_15px_rgba(var(--success),0.15)] transform';
  } else {
    containerClasses += 'backdrop-blur-md ';
    scale = 'hover:-translate-y-1 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),_0_8px_16px_rgba(0,0,0,0.4)] transform';
  }

  const lampTooltipText = (
    <div className="flex flex-col gap-2 p-1">
      <p className="font-semibold text-sm">How to read this Skill Tile:</p>
      <ul className="list-none space-y-2 text-[11px] opacity-90">
        <li><strong style={{ color: 'rgb(var(--warning))' }}>★★★★★ (Stars):</strong> Your overall achieved score, converted from a 0-100% scale into a 5-star rating for quick reading.</li>
        <li><strong style={{ color: 'rgb(var(--danger))' }}>GAP %:</strong> The exact percentage missing between your current score and what is required for your target grade.</li>
        <li><strong style={{ color: 'rgb(var(--danger))' }}>🚨 Red Glowing Border:</strong> Attention needed! This indicates a severe gap in a skill required for your next promotion.</li>
        <li><strong style={{ color: 'rgb(var(--success))' }}>✅ Faded/Muted Tile:</strong> Mastery achieved! You have met or exceeded the requirement for this skill.</li>
        <li><strong style={{ color: 'rgb(var(--warning))' }}>CRITICAL Badge:</strong> This specific skill is marked as absolutely essential by your department.</li>
      </ul>
    </div>
  );

  return (
    <div className={`${containerClasses} ${shadow} ${scale}`} style={borderStyle}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 pr-6">
          <h4 className="font-semibold text-sm leading-tight line-clamp-2" title={name} style={{ color: 'rgb(var(--text-1))' }}>
            {name}
          </h4>
          <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'rgb(var(--text-3))' }}>
            {domain}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 absolute top-4 right-4">
          {isCritical && (
            <span
              className="text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 tracking-wider"
              style={{ color: 'rgb(var(--warning))', backgroundColor: 'rgb(var(--warning-soft))' }}
            >
              Critical
            </span>
          )}
          <InfoTip 
            text={lampTooltipText} 
            icon={<IconBadge icon={<Lightbulb size={13} />} color="warning" size="sm" className="hover:scale-110 transition-transform" />} 
          />
        </div>
      </div>

      {/* Advanced Data Science Metrics Layout */}
      <div className="flex items-center gap-3 mt-1 min-h-[20px]">
        {momentum !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: momentum >= 0 ? 'rgb(var(--success))' : 'rgb(var(--danger))' }}>
            <IconBadge icon={<TrendingUp size={10} />} color={momentum >= 0 ? 'success' : 'danger'} size="sm" variant="ghost" />
            {momentum > 0 ? '+' : ''}{momentum}% Momentum
          </div>
        )}
        {percentile !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            <IconBadge icon={<Medal size={10} />} color="info" size="sm" variant="ghost" />
            Top {percentile}%
          </div>
        )}
      </div>

      {/* Body: Stars */}
      <div className="flex flex-col items-center justify-center mt-3 mb-5">
        <div 
          className="text-2xl tracking-[0.15em] font-black" 
          style={{ 
            color: 'rgb(var(--warning))',
            textShadow: '0px 2px 10px rgba(var(--warning), 0.3)' // Glowing effect
          }}
        >
          {getStars(score)}
        </div>
        <p className="text-[10px] uppercase font-bold mt-1.5 tracking-wider" style={{ color: 'rgb(var(--text-3))' }}>
          {Math.round((score / 100) * 5)} / 5 Level
        </p>
      </div>

      {/* Footer: Score Display */}
      <div className="mt-auto pt-4 border-t" style={{ borderColor: 'rgba(var(--border), 0.5)' }}>
        <div className="flex items-center justify-between">
          <ScoreDisplay
            score={score}
            threshold={hasRequirement ? required : undefined}
            size="sm"
            layout="horizontal"
            align="start"
            showLabel={false}
          />
          {hasRequirement && gap > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--danger))' }}>
              Gap: {gap}%
            </span>
          )}
        </div>
        <div className="mt-2.5 h-1.5 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: 'rgb(var(--surface-3))' }}>
          <div
            className="h-full rounded-full transition-all duration-700 shadow-[0_0_8px_currentColor]"
            style={{ 
              width: `${clampPct(score)}%`, 
              backgroundColor: hasRequirement 
                ? (meets ? 'rgb(var(--success))' : 'rgb(var(--danger))') 
                : 'rgb(var(--accent))' 
            }}
          />
        </div>
      </div>
    </div>
  );
};
