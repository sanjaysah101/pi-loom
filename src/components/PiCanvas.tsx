'use client';

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card, CardContent, Slider } from './ui';
import { Input } from './ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';

// Define the interface for the ref methods
export interface PiCanvasRef {
  updateColor: (color: string) => void;
  updateSize: (size: number) => void;
  updateRotationSpeed: (speed: number) => void;
  pulseEffect: () => void; // New method
}

interface PiCanvasProps {
  className?: string;
  initialColor?: string;
  initialSize?: number;
  initialRotationSpeed?: number;
}

// Use forwardRef to properly handle the ref
export const PiCanvas = forwardRef<PiCanvasRef, PiCanvasProps>(
  (
    {
      className,
      initialColor = '#3b82f6',
      initialSize = 1,
      initialRotationSpeed = 0.005,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const piMeshRef = useRef<THREE.Mesh | null>(null);
    const frameIdRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const [color, setColor] = useState(initialColor);
    const [size, setSize] = useState(initialSize);
    const [rotationSpeed, setRotationSpeed] = useState(initialRotationSpeed);
    const isMobile = useIsMobile();
    const [showControls, setShowControls] = useState(true);
    const [isPulsing, setIsPulsing] = useState(false);
    const fpsInterval = 1000 / 60; // Target 60 FPS

    // Function to update Pi model color
    const updateColor = (newColor: string) => {
      setColor(newColor);
      if (piMeshRef.current) {
        (piMeshRef.current.material as THREE.MeshStandardMaterial).color.set(
          newColor
        );
      }
    };

    // Function to update Pi model size
    const updateSize = (newSize: number) => {
      setSize(newSize);
      if (piMeshRef.current) {
        piMeshRef.current.scale.set(newSize, newSize, newSize);
      }
    };

    // Function to update rotation speed
    const updateRotationSpeed = (newSpeed: number) => {
      setRotationSpeed(newSpeed);
    };

    // Function to trigger a pulse effect
    const pulseEffect = () => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    };

    // Properly expose control functions to parent components
    useImperativeHandle(ref, () => ({
      updateColor,
      updateSize,
      updateRotationSpeed,
      pulseEffect,
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      // Initialize Three.js scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance

      // Create a 3D Pi symbol using ExtrudeGeometry for depth
      const piShape = new THREE.Shape();

      // Draw the Pi symbol shape
      piShape.moveTo(-1.0, 1.0); // Start at top left of horizontal bar
      piShape.lineTo(1.0, 1.0); // Draw horizontal bar to right
      piShape.lineTo(1.0, 0.8); // Down to bottom right of horizontal bar
      piShape.lineTo(-1.0, 0.8); // Back to left side
      piShape.lineTo(-1.0, 1.0); // Close the shape

      // Create a hole for the left vertical bar
      const leftBar = new THREE.Path();
      leftBar.moveTo(-0.5, 0.8);
      leftBar.lineTo(-0.5, -1.0);
      leftBar.lineTo(-0.3, -1.0);
      leftBar.lineTo(-0.3, 0.8);
      leftBar.lineTo(-0.5, 0.8);

      // Create a hole for the right vertical bar
      const rightBar = new THREE.Path();
      rightBar.moveTo(0.3, 0.8);
      rightBar.lineTo(0.3, -1.0);
      rightBar.lineTo(0.5, -1.0);
      rightBar.lineTo(0.5, 0.8);
      rightBar.lineTo(0.3, 0.8);

      // Add the vertical bars to the shape
      piShape.add(leftBar);
      piShape.add(rightBar);

      // Extrude settings
      const extrudeSettings = {
        steps: 1,
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 3,
      };

      // Create the extruded geometry
      const piGeometry = new THREE.ExtrudeGeometry(piShape, extrudeSettings);

      // Material with a nice blue color
      const piMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.5,
        roughness: 0.2,
      });

      const piMesh = new THREE.Mesh(piGeometry, piMaterial);
      // Center the geometry
      piMesh.position.set(0, 0, 0);
      piMesh.scale.set(size, size, size);
      piMeshRef.current = piMesh;
      scene.add(piMesh);

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Add a second light from another angle
      const secondLight = new THREE.DirectionalLight(0xffffff, 0.8);
      secondLight.position.set(-5, -5, 5);
      scene.add(secondLight);

      // Position camera - adjust for mobile
      camera.position.z = isMobile ? 6 : 5;

      // Add OrbitControls for mouse interaction
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;

      // Configure controls - adjust for mobile
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = isMobile ? 0.6 : 0.8; // Slower rotation on mobile
      controls.enableZoom = true;
      controls.zoomSpeed = isMobile ? 0.4 : 0.5;
      controls.minDistance = 3;
      controls.maxDistance = 10;

      // Add a subtle auto-rotation when not interacting
      let autoRotate = true;

      // Disable auto-rotation when user interacts
      controls.addEventListener('start', () => {
        autoRotate = false;
      });

      // Re-enable auto-rotation after a delay when user stops interacting
      controls.addEventListener('end', () => {
        setTimeout(() => {
          autoRotate = true;
        }, 3000);
      });

      // Animation loop
      const animate = (timestamp: number) => {
        frameIdRef.current = requestAnimationFrame(animate);

        // Calculate elapsed time since last frame
        const elapsed = timestamp - lastTimeRef.current;

        // Only render if enough time has passed
        if (elapsed > fpsInterval) {
          lastTimeRef.current = timestamp - (elapsed % fpsInterval);

          // Apply auto-rotation if enabled
          if (autoRotate && piMesh) {
            piMesh.rotation.y += rotationSpeed;
            piMesh.rotation.x += rotationSpeed * 0.4;
          }

          // Apply pulse effect if active
          if (isPulsing && piMesh) {
            const pulseScale = 1 + 0.2 * Math.sin(timestamp * 0.01);
            piMesh.scale.set(
              size * pulseScale,
              size * pulseScale,
              size * pulseScale
            );
          } else if (piMesh) {
            piMesh.scale.set(size, size, size);
          }

          // Update controls
          controls.update();

          renderer.render(scene, camera);
        }
      };

      lastTimeRef.current = performance.now();
      frameIdRef.current = requestAnimationFrame(animate);

      // Handle window resize
      const handleResize = () => {
        if (!canvasRef.current) return;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };

      window.addEventListener('resize', handleResize);

      return () => {
        if (frameIdRef.current !== null) {
          cancelAnimationFrame(frameIdRef.current);
        }
        window.removeEventListener('resize', handleResize);
        controls.dispose();
        renderer.dispose();
        piGeometry.dispose();
        piMaterial.dispose();
      };
    }, [
      color,
      size,
      initialRotationSpeed,
      rotationSpeed,
      isMobile,
      isPulsing,
      fpsInterval,
    ]);

    return (
      <>
        <canvas ref={canvasRef} className={className} />

        {/* Toggle button for controls */}
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-20 rounded-full w-8 h-8 p-0 backdrop-blur-sm bg-background/30"
          onClick={() => setShowControls(!showControls)}
        >
          <span className="sr-only">Toggle controls</span>
          {showControls ? '✕' : '⚙️'}
        </Button>

        {showControls && (
          <Card
            className={`fixed ${
              isMobile ? 'bottom-2 left-2 w-56' : 'bottom-4 left-4 w-64'
            } z-20`}
          >
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="text-xs font-medium cursor-help">
                      Model Color
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    Change the color of the 3D Pi symbol
                  </TooltipContent>
                </Tooltip>
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(e.target.value)}
                  className="h-8 cursor-pointer bg-transparent [&::-webkit-color-swatch]:rounded-md"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="text-xs font-medium cursor-help">
                        Model Size
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      Adjust the size of the 3D Pi symbol
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs">{size.toFixed(1)}x</span>
                </div>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[size]}
                  onValueChange={([value]) => updateSize(value)}
                  className="[&_.slider-thumb]:h-3 [&_.slider-thumb]:w-3"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="text-xs font-medium cursor-help">
                        Rotation Speed
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      Control how fast the Pi symbol rotates
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs">
                    {(rotationSpeed * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={0.02}
                  step={0.001}
                  value={[rotationSpeed]}
                  onValueChange={([value]) => updateRotationSpeed(value)}
                  className="[&_.slider-thumb]:h-3 [&_.slider-thumb]:w-3"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }
);

// Add display name to fix the ESLint error
PiCanvas.displayName = 'PiCanvas';
