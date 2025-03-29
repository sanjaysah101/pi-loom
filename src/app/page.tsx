'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PiCanvas } from '@/components/PiCanvas';

const HomePage = () => {
  return (
    <div className="relative min-h-screen">
      {/* 3D Pi Canvas */}
      <PiCanvas className="absolute inset-0 -z-10 w-full h-full" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="backdrop-blur-sm bg-background/30 p-8 rounded-xl shadow-lg border border-primary/10"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              Pi Loom
            </motion.h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              An AI-powered music composer that transforms the digits of π into
              harmonious musical patterns
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="px-8 shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/composer">Try the Composer</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="backdrop-blur-sm bg-background/50 hover:bg-background/70 transition-all"
              >
                <Link
                  href="https://github.com/sanjaysah101/pi-loom"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Try it: Click and drag to interact with the 3D π model
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
        >
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="h-full border-primary/10 shadow-md hover:shadow-lg transition-all backdrop-blur-sm bg-background/30">
              <CardHeader>
                <CardTitle className="text-primary">
                  π-Based Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground/80">
                  Converts π&apos;s digits into musical notes based on scales
                  and keys, creating unique melodies from the mathematical
                  constant.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="h-full border-primary/10 shadow-md hover:shadow-lg transition-all backdrop-blur-sm bg-background/30">
              <CardHeader>
                <CardTitle className="text-primary">
                  AI Pattern Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground/80">
                  Our AI detects and highlights patterns within π&apos;s
                  sequence, enhancing the musical experience with intelligent
                  composition.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="h-full border-primary/10 shadow-md hover:shadow-lg transition-all backdrop-blur-sm bg-background/30">
              <CardHeader>
                <CardTitle className="text-primary">
                  Interactive Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-foreground/80">
                  Visualize note frequencies and detected patterns in real-time
                  as you explore the musical representation of π.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <footer className="mt-24 text-center text-sm text-muted-foreground">
          <p>Created for the π-Day AI Hackathon 2025</p>
          <p className="mt-2">Licensed under MIT</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
