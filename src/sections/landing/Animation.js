import PropTypes from 'prop-types';
import React, { useEffect, useMemo } from 'react';

// third party
import { useInView } from 'react-intersection-observer';
import { motion, useAnimation } from 'framer-motion';

// =============================|| LANDING - FADE IN ANIMATION ||============================= //

function Animation({ children, variants }) {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true, // Only trigger once for better performance
    rootMargin: '50px' // Start animation before element is fully visible
  });

  // Memoize transition to avoid recreating on each render
  const transition = useMemo(() => ({
    x: {
      type: 'spring',
      stiffness: 100, // Reduced for smoother animation
      damping: 25,
      duration: 0.4 // Slightly faster
    },
    opacity: { duration: 0.6 } // Faster opacity transition
  }), []);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={transition}
      variants={variants}
      style={{
        willChange: 'transform, opacity' // Optimize for animation
      }}
    >
      {children}
    </motion.div>
  );
}

Animation.propTypes = {
  children: PropTypes.node,
  variants: PropTypes.object
};

export default Animation;