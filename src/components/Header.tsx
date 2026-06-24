import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { MagneticButton } from "./MagneticButton";

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, isAuthenticated, projects } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "pt-BR" ? "en" : "pt-BR");
  };

  const languageTarget =
    language !== "pt-BR"
      ? { short: "EN", flag: "🇺🇸", ariaLabel: "Switch language to English" }
      : { short: "PT", flag: "🇧🇷", ariaLabel: "Mudar idioma para Português" };

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);

    if (href.startsWith("#")) {
      if (href === "#top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(href);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showWorkLink = !!projects && projects.length > 0;

  const navLinks = [
    { name: language === "pt-BR" ? "Trabalhos" : "Work", href: "#work", show: showWorkLink },
    { name: language === "pt-BR" ? "Sobre" : "About", href: "#about" },
    { name: language === "pt-BR" ? "Serviços" : "Services", href: "#services" },
    { name: language === "pt-BR" ? "Contato" : "Contact", href: "#contact" },
  ].filter((link) => link.show !== false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500
        ${
          isScrolled
            ? "py-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 shadow-lg"
            : "py-8 bg-gradient-to-b from-black/90 via-black/50 to-transparent"
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <MagneticButton>
            <Link
              to="/"
              onClick={handleHomeClick}
              className="text-2xl font-display font-bold tracking-tighter text-white hover:text-gray-300 transition-colors interactive drop-shadow-md"
            >
              MAURO ROCHA
            </Link>
          </MagneticButton>

          <>
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-8 items-center">
              {navLinks.map((link) => (
                <MagneticButton key={link.name}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-sm font-bold uppercase tracking-widest text-white hover:text-blue-400 transition-colors interactive drop-shadow-md"
                  >
                    {link.name}
                  </button>
                </MagneticButton>
              ))}

              <div className="w-px h-6 bg-white/20 mx-2"></div>

              <MagneticButton onClick={toggleLanguage}>
                <button
                  aria-label={languageTarget.ariaLabel}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white hover:text-blue-400 transition-colors interactive drop-shadow-md"
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {languageTarget.flag}
                  </span>
                </button>
              </MagneticButton>
            </nav>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-4">
              <MagneticButton onClick={toggleLanguage}>
                <button
                  aria-label={languageTarget.ariaLabel}
                  className="flex items-center gap-1 text-xs font-bold uppercase text-white drop-shadow-md"
                >
                  <span className="text-sm leading-none" aria-hidden="true">
                    {languageTarget.flag}
                  </span>
                  {languageTarget.short}
                </button>
              </MagneticButton>
              <MagneticButton onClick={() => setIsMenuOpen(true)}>
                <Menu className="w-8 h-8 interactive text-white drop-shadow-md" />
              </MagneticButton>
            </div>
          </>
        </div>
      </header>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 bg-[#0a0a0a] z-[60] flex flex-col justify-center items-center"
          >
            <div className="absolute top-8 right-6">
              <MagneticButton onClick={() => setIsMenuOpen(false)}>
                <X className="w-10 h-10 interactive text-white" />
              </MagneticButton>
            </div>

            <nav className="flex flex-col gap-8 text-center">
              {navLinks.map((link) => (
                <MagneticButton key={link.name}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-6xl font-display font-bold uppercase text-white hover:text-blue-500 transition-all duration-300 interactive"
                  >
                    {link.name}
                  </button>
                </MagneticButton>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
