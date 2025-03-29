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

// Define the interface for the ref methods
export interface PiCanvasRef {
  updateColor: (color: string) => void;
  updateSize: (size: number) => void;
  updateRotationSpeed: (speed: number) => void;
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
    const [color, setColor] = useState(initialColor);
    const [size, setSize] = useState(initialSize);
    const [rotationSpeed, setRotationSpeed] = useState(initialRotationSpeed);

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

    // Properly expose control functions to parent components
    useImperativeHandle(ref, () => ({
      updateColor,
      updateSize,
      updateRotationSpeed,
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
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

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

      // Position camera
      camera.position.z = 5;

      // Add OrbitControls for mouse interaction
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;

      // Configure controls
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.8;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.5;
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
      const animate = () => {
        requestAnimationFrame(animate);

        // Apply auto-rotation if enabled
        if (autoRotate && piMesh) {
          piMesh.rotation.y += rotationSpeed;
          piMesh.rotation.x += rotationSpeed * 0.4;
        }

        // Update controls
        controls.update();

        renderer.render(scene, camera);
      };

      animate();

      // Handle window resize
      const handleResize = () => {
        if (!canvasRef.current) return;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        controls.dispose();
        renderer.dispose();
        piGeometry.dispose();
        piMaterial.dispose();
      };
    }, [color, size, initialRotationSpeed, rotationSpeed]);

    return (
      <>
        <canvas ref={canvasRef} className={className} />
        <Card className="fixed bottom-4 left-4 z-20 w-64">
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Model Color</label>
              <Input
                type="color"
                value={color}
                onChange={(e) => updateColor(e.target.value)}
                className="h-8 cursor-pointer bg-transparent [&::-webkit-color-swatch]:rounded-md"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium">Model Size</label>
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
                <label className="text-xs font-medium">Rotation Speed</label>
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
      </>
    );
  }
);

// Add display name to fix the ESLint error
PiCanvas.displayName = 'PiCanvas';
