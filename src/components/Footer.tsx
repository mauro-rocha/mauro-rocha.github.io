import React from 'react';
import { MagneticButton } from './MagneticButton';
import { Github, Linkedin, Instagram, Phone } from 'lucide-react';
import { useData } from '../context/DataContext';

export const Footer: React.FC = () => {
  const { content, language } = useData();
  const t = content.contact;

  return (
    <footer
      id="contact"
      className="py-24 px-6 bg-black/80 backdrop-blur-xl border-t border-white/10 relative z-20"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 600px' }}
    >
      <div className="container mx-auto flex flex-col items-center text-center">
        <h2 className="text-5xl md:text-8xl font-display font-bold mb-12 tracking-tighter interactive">
          {t.title[language]}
        </h2>

        <div className="flex flex-col md:flex-row gap-6 mb-12">
            <MagneticButton className="relative hover:z-50">
            <a
                href={`mailto:${t.email}`}
                className="text-lg md:text-2xl px-8 py-4 border border-white/30 rounded-full hover:bg-white hover:text-black transition-all duration-300 interactive inline-block"
            >
                {t.email}
            </a>
            </MagneticButton>

            <MagneticButton className="relative hover:z-50">
                <a
                href="https://wa.me/5555997036280"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg md:text-2xl px-8 py-4 bg-green-600/20 border border-green-500/50 text-green-400 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300 interactive inline-flex items-center gap-2 hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:scale-105"
                >
                <Phone className="w-5 h-5" />
                WhatsApp
                </a>
            </MagneticButton>
        </div>

        <div className="flex gap-8 mb-16">
          <MagneticButton className="relative hover:z-50">
             <a
               href="https://github.com/mauro-rocha"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="GitHub do Mauro Rocha"
               className="block p-4 bg-white/5 border border-white/10 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300 hover:scale-125 hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] interactive group relative overflow-hidden"
             >
               <div className="relative z-10">
                 <Github className="w-6 h-6" />
               </div>
             </a>
          </MagneticButton>
          <MagneticButton className="relative hover:z-50">
             <a
               href="https://www.linkedin.com/in/mauro-lucio-rocha/"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="LinkedIn do Mauro Rocha"
               className="block p-4 bg-white/5 border border-white/10 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300 hover:scale-125 hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] interactive group relative overflow-hidden"
             >
               <div className="relative z-10">
                 <Linkedin className="w-6 h-6" />
               </div>
             </a>
          </MagneticButton>
          <MagneticButton className="relative hover:z-50">
             <a
               href="https://www.instagram.com/mauro.rockit"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="Instagram do Mauro Rocha"
               className="block p-4 bg-white/5 border border-white/10 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300 hover:scale-125 hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] interactive group relative overflow-hidden"
             >
               <div className="relative z-10">
                 <Instagram className="w-6 h-6" />
               </div>
             </a>
          </MagneticButton>
        </div>

        <div className="flex justify-between w-full text-xs text-white uppercase tracking-widest mt-12">
          <span>© 2026 Mauro Rocha</span>
        </div>
      </div>
    </footer>
  );
};
