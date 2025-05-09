import { motion } from "framer-motion";
import { FaSpotify, FaBrain, FaMusic } from "react-icons/fa";
import styled from "styled-components";

const features = [
  {
    icon: <FaSpotify size={40} />,
    title: "Connect Spotify",
    description: "Log in and paste your playlist link."
  },
  {
    icon: <FaBrain size={40} />,
    title: "Detect Mood",
    description: "Choose what mood you want to listen to."
  },
  {
    icon: <FaMusic size={40} />,
    title: "Curate Vibes",
    description: "Get personalized song suggestions based on your playlist."
  }
];

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
  margin: 2rem auto;
  width: fit-content;
  perspective: 1000px;
`;

const GlassCard = styled(motion.div)`
  position: relative;
  width: 200px;
  height: 250px;
  background: linear-gradient(rgba(255, 255, 255, 0.1), transparent);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 15px;
  margin: 0 -30px;
  backdrop-filter: blur(12px);
  padding: 25px;
  text-align: center;
  color: white;
  cursor: pointer;
  z-index: ${props => props.$index};
  transform: rotate(${props => props.$rotation}deg);

  &:hover {
    transform: rotate(0deg) scale(1.05);
    margin: 0 20px;
    background: linear-gradient(rgba(255, 255, 255, 0.15), transparent);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    z-index: 10;
  }

  &::before {
    content: attr(data-title);
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 1px;
  }
`;

const IconWrapper = styled.div`
  margin-bottom: 25px;
  transition: transform 0.3s ease;
  
  ${GlassCard}:hover & {
    transform: translateY(-10px);
  }
`;

const Description = styled.p`
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.5;
`;

export default function FeatureShowcase() {
  return (
    <Container>
      {features.map((feature, index) => (
        <GlassCard
          key={index}
          $rotation={[-15, 5, 15][index]}
          $index={index + 1}
          data-title={feature.title}
          whileHover={{
            boxShadow: "0 30px 50px rgba(0, 0, 0, 0.4)"
          }}
        >
          <IconWrapper>{feature.icon}</IconWrapper>
          <Description>{feature.description}</Description>
        </GlassCard>
      ))}
    </Container>
  );
}