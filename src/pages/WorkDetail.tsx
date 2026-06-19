import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "../components/Footer";
import { MagneticButton } from "../components/MagneticButton";
import { useData } from "../context/DataContext";
import { slugify } from "../utils/slug";

export const WorkDetail: React.FC = () => {
  const { slug } = useParams();
  const { projects, language } = useData();
  const navigate = useNavigate();

  const project =
    projects.find((p) => slugify(p.title) === slug) ??
    // Backwards compatibility with old numeric URLs (/work/9)
    projects.find((p) => String(p.id) === slug);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <div className="text-center">
          <h1 className="text-4xl font-display mb-4">Project Not Found</h1>
          <MagneticButton onClick={() => navigate("/")}>
            <span className="text-lg underline cursor-pointer">Go Home</span>
          </MagneticButton>
        </div>
      </div>
    );
  }

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="pt-32 pb-12 container mx-auto px-6">
        <MagneticButton onClick={() => navigate("/")} strength={0}>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white mb-12 interactive">
            <ArrowLeft className="w-5 h-5" />
            <span className="uppercase tracking-widest text-sm">
              {language === "pt-BR" ? "Voltar" : "Back"}
            </span>
          </button>
        </MagneticButton>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-16">
            <header className="mb-10">
              <span className="text-accent text-sm font-mono mb-4 block">
                {project.year} — {project.client}
              </span>
              <h1 className="text-5xl md:text-8xl font-display font-bold uppercase leading-none mb-8">
                {project.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed w-full">
                {project.fullDescription[language]}
              </p>
            </header>

            <div className="mb-8">
              <h3 className="text-sm font-mono uppercase text-gray-500 mb-3">Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.stack?.map((tech) => (
                  <span
                    key={tech}
                    className="text-sm border border-white/20 px-3 py-1 rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <MagneticButton>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold uppercase text-sm tracking-widest hover:bg-gray-200 transition-colors interactive"
                >
                  {language === "pt-BR" ? "Visitar Site" : "Visit Live"}{" "}
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </MagneticButton>
              <MagneticButton onClick={scrollToContact}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3 rounded-full font-bold uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-colors interactive"
                >
                  {language === "pt-BR" ? "Contato" : "Contact"}
                </button>
              </MagneticButton>
            </div>
          </div>

          <div className="w-full aspect-video rounded-2xl overflow-hidden mb-12">
            <img
              src={project.image}
              alt={project.title}
              loading="eager"
              decoding="async"
              fetchpriority="high"
              width={1600}
              height={900}
              className="w-full h-full object-cover"
            />
          </div>

          {project.gallery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
              {project.gallery.map((img, idx) => (
                <div key={idx} className="w-full aspect-[4/3] rounded-xl overflow-hidden">
                  <img
                    src={img}
                    alt={`${project.title} detail ${idx}`}
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                    width={1200}
                    height={900}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};
