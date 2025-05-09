import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import "./FloatingOrb.css";

const FloatingOrb = () => {
  const controls = useAnimation();
  const orbRef = useRef(null);

  const moveOrbRandomly = () => {
    const orbSize = 80;

    // Define boundaries (adjust to your layout)
    const margin = 40;
    const minX = window.innerWidth * 0.25;
    const maxX = window.innerWidth * 0.75 - orbSize;

    const minY = window.innerHeight * 0.6;
    const maxY = window.innerHeight - 100;

    const randomX = Math.floor(Math.random() * (maxX - minX)) + minX;
    const randomY = Math.floor(Math.random() * (maxY - minY)) + minY;

    controls.start({
      x: randomX,
      y: randomY,
      backgroundColor: getRandomColor(),
      transition: { type: "spring", stiffness: 150 },
    });
  };

  useEffect(() => {
    // Set initial position near center bottom within boundary
    const initialX = (window.innerWidth / 2) - 40;
    const initialY = window.innerHeight - 120;
    controls.set({ x: initialX, y: initialY });
  }, [controls]);

  return (
    <motion.div
      ref={orbRef}
      className="floating-orb"
      animate={controls}
      onMouseEnter={moveOrbRandomly}
      whileHover={{ scale: 1.1 }}
    />
  );
};

const getRandomColor = () => {
  const colors = ["#581845", "#84bfa0", "#f36885", "#f368e2", "#d4d6d7", "#2431b0"];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default FloatingOrb;
