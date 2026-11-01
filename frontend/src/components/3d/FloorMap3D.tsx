'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { getTableStatusColor } from './tableStatusColor';

export interface PosTableItem {
  id: string;
  number: string;
  capacity: number;
  status: 'IDLE' | 'OCCUPIED' | 'BILLING' | string;
  currentTotal: number;
  itemCount: number;
}

interface Table3DProps {
  table: PosTableItem;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (table: PosTableItem) => void;
}

function Table3D({ table, position, isSelected, onSelect }: Table3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const colorSpec = getTableStatusColor(table.status);

  // Blinking animation for SLA / BILLING tables
  useFrame((state) => {
    if (colorSpec.blinking && materialRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2; // 0 to 1
      materialRef.current.emissiveIntensity = 0.4 + pulse * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Table Top */}
      <mesh
        ref={meshRef}
        position={[0, 0.4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(table);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.9, 0.9, 0.15, 32]} />
        <meshStandardMaterial
          ref={materialRef}
          color={colorSpec.base}
          emissive={colorSpec.emissive}
          emissiveIntensity={isSelected ? 0.8 : colorSpec.blinking ? 0.6 : hovered ? 0.4 : 0.15}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Table Base / Pedestal */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.35, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.04, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Selection Glow Ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.2, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Table Number Text */}
      <Text
        position={[0, 0.52, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.24}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#090d16"
      >
        {table.number}
      </Text>

      {/* Subtitle Text (Capacity or Status) */}
      <Text
        position={[0, 0.52, 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.14}
        color={isSelected ? '#7dd3fc' : '#cbd5e1'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#090d16"
      >
        {`${table.capacity} chỗ • ${table.itemCount > 0 ? `${table.itemCount} món` : 'Trống'}`}
      </Text>

      {/* Simplified Chairs arranged around table */}
      {Array.from({ length: Math.min(table.capacity, 4) }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / Math.min(table.capacity, 4);
        const chairDist = 1.15;
        const cx = Math.cos(angle) * chairDist;
        const cz = Math.sin(angle) * chairDist;
        return (
          <group key={i} position={[cx, 0.15, cz]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <RoundedBox args={[0.3, 0.3, 0.06]} radius={0.02} smoothness={4} position={[0, 0.12, 0.12]}>
              <meshStandardMaterial color="#475569" />
            </RoundedBox>
            <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
              <meshStandardMaterial color="#64748b" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export interface FloorMap3DProps {
  tables: PosTableItem[];
  selectedTableId: string;
  onSelectTable: (table: PosTableItem) => void;
}

export function FloorMap3D({ tables, selectedTableId, onSelectTable }: FloorMap3DProps) {
  // Deterministic 3x2 Grid positions for the 6 tables
  // Row 1: x = -2.6, 0, 2.6, z = -1.6
  // Row 2: x = -2.6, 0, 2.6, z = 1.6
  const getTablePosition = (index: number): [number, number, number] => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = (col - 1) * 2.8;
    const z = (row - 0.5) * 2.8;
    return [x, 0, z];
  };

  return (
    <div className="w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800 relative">
      <Canvas
        camera={{ position: [0, 6.5, 5.5], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Floor Grid Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[12, 9]} />
          <meshStandardMaterial color="#0b1120" roughness={0.8} metalness={0.2} />
        </mesh>
        <gridHelper args={[12, 12, '#334155', '#1e293b']} position={[0, 0, 0]} />

        {/* Render 6 Tables */}
        {tables.map((table, index) => (
          <Table3D
            key={table.id}
            table={table}
            position={getTablePosition(index)}
            isSelected={table.id === selectedTableId}
            onSelect={onSelectTable}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.3} // Keep camera above ground
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-none">
        💡 Kéo chuột/chạm để xoay góc nhìn 3D • Nhấp vào bàn để chọn
      </div>
    </div>
  );
}

export default FloorMap3D;
