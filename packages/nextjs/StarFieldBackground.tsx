"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  color: string;
}

interface Meteor {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

interface Dust {
  id: number;
  x: number;
  y: number;
}

export function StarFieldBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [dusts, setDusts] = useState<Dust[]>([]);

  // 生成星星
  useEffect(() => {
    const generateStars = () => {
      const starArray: Star[] = [];
      const colors = [
        "#00FFFF", // 青色
        "#FF00FF", // 粉色
        "#FFFFFF", // 白色
        "#8A2BE2", // 紫色
        "#00CED1", // 深青色
        "#FF69B4", // 热粉色
      ];

      // 远景小星星 (100个)
      for (let i = 0; i < 100; i++) {
        starArray.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 1 + 0.5,
          brightness: Math.random() * 0.6 + 0.4,
          twinkleSpeed: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // 中景星星 (50个)
      for (let i = 100; i < 150; i++) {
        starArray.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          brightness: Math.random() * 0.4 + 0.6,
          twinkleSpeed: Math.random() * 4 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      // 近景亮星 (20个)
      for (let i = 150; i < 170; i++) {
        starArray.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 2,
          brightness: Math.random() * 0.3 + 0.7,
          twinkleSpeed: Math.random() * 5 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      setStars(starArray);
    };

    generateStars();
  }, []);

  // 生成流星
  useEffect(() => {
    const generateMeteors = () => {
      const meteorArray: Meteor[] = [];

      for (let i = 0; i < 3; i++) {
        meteorArray.push({
          id: i,
          startX: Math.random() * 100,
          startY: -10,
          endX: Math.random() * 100,
          endY: 110,
          duration: Math.random() * 3 + 2,
          delay: Math.random() * 10,
        });
      }

      setMeteors(meteorArray);
    };

    generateMeteors();

    // 每隔一段时间重新生成流星
    const interval = setInterval(generateMeteors, 15000);
    return () => clearInterval(interval);
  }, []);

  // 生成宇宙尘埃
  useEffect(() => {
    const dustArray: Dust[] = [];
    for (let i = 0; i < 30; i++) {
      dustArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }
    setDusts(dustArray);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: -10 }}>
      {/* 深空渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-slate-950 to-black"></div>

      {/* 星云效果 */}
      <div className="absolute inset-0">
        {/* 主星云 */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(0,255,255,0.3) 0%, rgba(255,0,255,0.2) 50%, transparent 100%)",
            top: "20%",
            left: "10%",
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 200, repeat: Infinity, ease: "linear" },
          }}
        />

        {/* 次星云 */}
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(255,0,255,0.4) 0%, rgba(138,43,226,0.2) 50%, transparent 100%)",
            top: "60%",
            right: "15%",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 270, 180, 90, 0],
          }}
          transition={{
            scale: { duration: 25, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 180, repeat: Infinity, ease: "linear" },
          }}
        />

        {/* 小星云 */}
        <motion.div
          className="absolute w-32 h-32 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(0,206,209,0.5) 0%, transparent 70%)",
            top: "10%",
            right: "30%",
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 远景星星层 */}
      <div className="absolute inset-0">
        {stars.slice(0, 100).map(star => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
            }}
            animate={{
              opacity: [star.brightness * 0.3, star.brightness, star.brightness * 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: star.twinkleSpeed,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* 中景星星层 */}
      <div className="absolute inset-0">
        {stars.slice(100, 150).map(star => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            }}
            animate={{
              opacity: [star.brightness * 0.4, star.brightness, star.brightness * 0.4],
              scale: [0.9, 1.1, 0.9],
              rotate: [0, 360],
            }}
            transition={{
              opacity: { duration: star.twinkleSpeed, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: star.twinkleSpeed, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: star.twinkleSpeed * 3, repeat: Infinity, ease: "linear" },
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* 近景亮星层 */}
      <div className="absolute inset-0">
        {stars.slice(150, 170).map(star => (
          <motion.div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
            }}
          >
            {/* 主星体 */}
            <motion.div
              className="rounded-full relative"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                boxShadow: `0 0 ${star.size * 3}px ${star.color}, 0 0 ${star.size * 6}px ${star.color}`,
              }}
              animate={{
                opacity: [star.brightness * 0.6, 1, star.brightness * 0.6],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: star.twinkleSpeed,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 4,
              }}
            />

            {/* 十字光芒 */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              animate={{
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                rotate: { duration: star.twinkleSpeed * 4, repeat: Infinity, ease: "linear" },
                scale: { duration: star.twinkleSpeed, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              {/* 水平光线 */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${star.size * 4}px`,
                  height: "1px",
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${star.size}px ${star.color}`,
                }}
              />
              {/* 垂直光线 */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: "1px",
                  height: `${star.size * 4}px`,
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${star.size}px ${star.color}`,
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* 流星层 */}
      <div className="absolute inset-0">
        {meteors.map(meteor => (
          <motion.div
            key={meteor.id}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${meteor.startX}%`,
              top: `${meteor.startY}%`,
              boxShadow: "0 0 6px #00FFFF, 0 0 12px #00FFFF",
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: `${meteor.endX - meteor.startX}vw`,
              y: `${meteor.endY - meteor.startY}vh`,
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: meteor.duration,
              delay: meteor.delay,
              repeat: Infinity,
              repeatDelay: 10,
              ease: "easeOut",
            }}
          >
            {/* 流星尾巴 */}
            <motion.div
              className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full origin-left"
              style={{
                transform: "rotate(-45deg) translateX(-100%)",
              }}
              animate={{
                scaleX: [0, 1, 1, 0],
                opacity: [0, 0.8, 0.8, 0],
              }}
              transition={{
                duration: meteor.duration,
                delay: meteor.delay,
                repeat: Infinity,
                repeatDelay: 10,
                ease: "easeOut",
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* 宇宙尘埃效果 */}
      <div className="absolute inset-0">
        {dusts.map(dust => (
          <motion.div
            key={`dust-${dust.id}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-30"
            style={{
              left: `${dust.x}%`,
              top: `${dust.y}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.1, 0.5, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 30,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      {/* 深空粒子效果 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, rgba(0,255,255,0.3), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,0,255,0.3), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(138,43,226,0.3), transparent),
            radial-gradient(2px 2px at 160px 30px, rgba(0,206,209,0.3), transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}
