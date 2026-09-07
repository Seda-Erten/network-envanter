"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

const nodeWidth = 200;
const nodeHeight = 70;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 150, 
    nodesep: 100 
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  
  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };
    newNode.targetPosition = isHorizontal ? 'left' : 'top';
    newNode.sourcePosition = isHorizontal ? 'right' : 'bottom';
    
    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const formatNodes = (devices) => {
  return devices.map((d) => {
    return {
      id: d.id.toString(),
      data: { 
        label: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: 14 }}>{d.name}</div>
            <div style={{ fontSize: 10, color: '#a1a1aa' }}>{d.type.toUpperCase()} - {d.ip_address || "No IP"}</div>
          </div>
        )
      },
      position: { x: 0, y: 0 }, 
      style: {
        background: '#ffffff',
        border: `2px solid ${d.type === 'switch' ? '#16a34a' : d.type === 'router' ? '#d97706' : d.type === 'patch_panel' ? '#64748b' : '#0284c7'}`,
        borderRadius: 8,
        color: '#1e293b',
        padding: 10,
        width: nodeWidth,
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
      },
      type: 'default',
    };
  });
};

const formatEdges = (connections) => {
  return connections.map(c => ({
    id: `e${c.id}`,
    source: c.device_a_id.toString(),
    target: c.device_b_id.toString(),
    label: `${c.port_a} ↔ ${c.port_b}`,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#f8fafc', color: '#1e293b', fillOpacity: 0.9, stroke: '#cbd5e1' },
    labelStyle: { fill: '#1e293b', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' },
    style: { stroke: c.color || '#0284c7', strokeWidth: 2 },
    animated: c.status === 'aktif',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: c.color || '#0284c7',
    },
  }));
};

export default function TopologyMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [devRes, connRes] = await Promise.all([
      fetch("/api/devices"),
      fetch("/api/connections")
    ]);
    const devData = await devRes.json();
    const connData = await connRes.json();

    const filteredDevData = devData.filter(d => d.type !== 'duvar_prizi');
    const filteredDevIds = new Set(filteredDevData.map(d => d.id));
    const filteredConnData = connData.filter(c => filteredDevIds.has(c.device_a_id) && filteredDevIds.has(c.device_b_id));

    const initialNodes = formatNodes(filteredDevData);
    const initialEdges = formatEdges(filteredConnData);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'RL' 
    );
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);
  
  const onLayout = useCallback(
    (direction) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );
  
  return (
    <div className="shell" style={{ maxWidth: '100%', height: '100vh', padding: '20px' }}>
      <header className="masthead" style={{ marginBottom: 20, paddingBottom: 10 }}>
        <div>
          <p className="masthead-eyebrow">Ağ Haritası</p>
          <h1 style={{fontSize: 24, margin: 0}}>Otomatik Hiyerarşik Topoloji</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/" className="submit-btn" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
            ← Panele Dön
          </Link>
        </div>
      </header>

      <div className="panel" style={{ width: '100%', height: 'calc(100vh - 120px)', background: '#ffffff', position: 'relative' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Topoloji Algoritması Çalışıyor...</div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            minZoom={0.2}
            theme="light"
          >
            <Panel position="top-right" style={{background: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', gap: 10}}>
              <span style={{fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center'}}>Dizilim Yönü:</span>
              <button className="icon-btn" onClick={() => onLayout('TB')}>Yukarıdan Aşağı</button>
              <button className="icon-btn" onClick={() => onLayout('LR')}>Soldan Sağa</button>
              <button className="icon-btn" onClick={() => onLayout('RL')}>Sağdan Sola</button>
            </Panel>
            <Controls />
            <MiniMap 
              nodeColor={(node) => node.style?.borderColor || '#0284c7'}
              maskColor="rgba(241, 245, 249, 0.7)"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
            <Background variant="dots" gap={20} size={1} color="#cbd5e1" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
