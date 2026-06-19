import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { Project } from "../../types";
import { slugify } from "../../utils/slug";

const ProjectCard: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
  const { language } = useData();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true }}
      onClick={() => navigate(`/work/${slugify(project.title)}`)}
      className="group relative w-full border-t border-white/10 py-12 md:py-16 cursor-pointer interactive hover:bg-white/5 transition-colors duration-300"
    >
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="w-full md:w-1/2">
          <span className="text-sm font-mono text-accent mb-2 block">
            {project.year} — {project.category[language]}
          </span>
          <h3 className="text-4xl md:text-6xl font-display font-bold uppercase transition-colors duration-300 text-white group-hover:text-blue-300 drop-shadow-md">
            {project.title}
          </h3>
          <p className="mt-4 text-gray-300 max-w-md opacity-100 translate-y-0 text-lg">
            {project.description[language]}
          </p>
        </div>

        <div className="w-full md:w-1/3 rounded-lg aspect-video md:aspect-[16/9] shadow-2xl border border-white/10">
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            width={1200}
            height={900}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="hidden md:block">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300 bg-black/40 backdrop-blur-md">
            <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export { ProjectCard };
