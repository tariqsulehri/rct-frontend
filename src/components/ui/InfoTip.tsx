import React from 'react';
import { Info } from 'lucide-react';

interface InfoTipProps {
  text: string;
}

export const InfoTip: React.FC<InfoTipProps> = ({ text }) => (
  <button
    type="button"
    className="btn-ghost w-6 h-6 p-0 rounded-lg inline-flex items-center justify-center shrink-0"
    title={text}
    aria-label={text}
    onClick={(event) => event.stopPropagation()}
  >
    <Info size={13} />
  </button>
);
