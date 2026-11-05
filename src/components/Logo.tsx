import { Plane } from 'lucide-react';

export function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const sizes = {
    sm: { icon: 18, text: 'text-base', gap: 'gap-2' },
    md: { icon: 24, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 32, text: 'text-2xl', gap: 'gap-3' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      <div className="relative">
        <div className={`flex items-center justify-center rounded-xl ${light ? 'bg-white/15' : 'bg-gradient-to-br from-turquoise-500 to-turquoise-700'} p-1.5`}>
          <Plane size={s.icon} className={light ? 'text-white' : 'text-white'} />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-turquoise-400 rounded-full border-2 border-navy-900" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold ${s.text} ${light ? 'text-white' : 'text-navy-900'}`}>
          ST<span className="text-turquoise-500">&</span>ID
        </span>
        <span className={`text-[10px] font-medium tracking-wider uppercase ${light ? 'text-white/60' : 'text-navy-400'}`}>
          Smart Travel & Identity
        </span>
      </div>
    </div>
  );
}
