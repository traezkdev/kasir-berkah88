import React from 'react';
import { 
  Instagram, 
  Github, 
  Globe, 
  Heart, 
  Code, 
  Coffee, 
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const Credits = () => {
  const developer = {
    name: 'M Alfin Firdaus',
    devName: 'trazkdev',
    ig: '@alfinf1rdaus',
    github: 'traezkdev',
    role: 'Fullstack Developer & UI Designer',
    location: 'Indonesia',
    bio: 'Saya adalah pengembang di balik trzfinance, berkomitmen untuk menghadirkan solusi pengelolaan keuangan yang modern dan efisien.'
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Aesthetic Background Elements */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      
      <div className="max-w-4xl w-full px-6 text-center space-y-12">
        {/* Header Section */}
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4"
          >
            <Sparkles size={14} /> <span>Crafted with Passion</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Meet the <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">Developer</span>
          </h1>
        </div>

        {/* Developer Card */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-10">
            {/* Avatar Section */}
            <div className="relative shrink-0">
               <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 transform -rotate-3 transition-transform group-hover:rotate-0 duration-500">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${developer.name}&background=4F46E5&color=fff&size=400`} 
                    alt={developer.name}
                    className="w-full h-full object-cover"
                  />
               </div>
               <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-slate-700 transform rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <Code size={32} strokeWidth={2.5} />
               </div>
            </div>

            {/* Info Section */}
            <div className="text-center md:text-left flex-1 space-y-6">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2 uppercase">{developer.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                   <span className="text-sm font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{developer.devName}</span>
                   <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                   <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{developer.role}</span>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm max-w-md italic">
                "{developer.bio}"
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a 
                  href={`https://instagram.com/${developer.ig.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                >
                  <Instagram size={16} /> <span>{developer.ig}</span>
                </a>
                <div className="flex items-center gap-2">
                   <a 
                    href={`https://github.com/${developer.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all border border-gray-100 dark:border-slate-700"
                    title="GitHub Profile"
                   >
                      <Github size={20} />
                   </a>
                   <button className="p-3 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all border border-gray-100 dark:border-slate-700">
                      <Globe size={20} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, label: 'Modern UI/UX', desc: 'Desain yang bersih & responsif.' },
            { icon: Coffee, label: 'Daily Support', desc: 'Pemantauan sistem 24/7.' },
            { icon: Heart, label: 'Community', desc: 'Terbuka untuk saran/masukan.' },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-slate-800 text-center space-y-3"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
                <item.icon size={20} />
              </div>
              <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{item.label}</h4>
              <p className="text-[9px] text-gray-400 font-bold leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer Credits */}
        <div className="pt-10 flex flex-col items-center gap-4">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Project TRZFINANCE v1.2.0</p>
           <div className="flex items-center gap-3">
              <span className="w-10 h-[1px] bg-gray-100 dark:bg-slate-800" />
              <Heart size={14} className="text-rose-500 fill-rose-500 animate-bounce" />
              <span className="w-10 h-[1px] bg-gray-100 dark:bg-slate-800" />
           </div>
           <p className="text-[8px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-loose">
              Terima kasih telah menggunakan aplikasi ini.<br/>
              Mari bertumbuh bersama secara finansial.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
