import { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Network, Loader2, Maximize2, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface GraphNode {
    id: string;
    type: 'business' | 'vendor';
    name: string;
    risk_score?: number;
    val: number;
}

interface GraphLink {
    source: string;
    target: string;
    total_amount: number;
    tx_count: number;
}

export default function NetworkGraph() {
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

    useEffect(() => {
        const loadGraph = async () => {
            try {
                setLoading(true);
                const data = await api.fraud.network();
                // Force graph modifies objects, so clone them
                setGraphData({
                    nodes: data.nodes.map((n: any) => ({ ...n, val: n.type === 'vendor' ? Math.max(1, (n.risk_score || 0.1) * 2.5) : 3 })),
                    links: data.links.map((l: any) => ({ ...l }))
                });
            } catch (err) {
                console.error("Failed to load network graph:", err);
            } finally {
                setLoading(false);
            }
        };
        loadGraph();
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', updateDimensions);
        // Add a slight delay for flexbox to settle before first measure
        setTimeout(updateDimensions, 100);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const handleZoomIn = () => {
        graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 400);
    };

    const handleZoomOut = () => {
        graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 400);
    };

    const handleFit = () => {
        graphRef.current?.zoomToFit(400, 50);
    };

    const handleNodeClick = useCallback((node: any) => {
        graphRef.current?.centerAt(node.x, node.y, 1000);
        graphRef.current?.zoom(1.5, 1000);
    }, []);

    return (
        <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-cyber-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyber-alert/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto max-w-7xl flex flex-col h-[calc(100vh-theme(spacing.20))] flex-grow px-6 py-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 space-y-6 lg:space-y-0"
                >
                    <div className="flex-1">
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3 text-white font-mono mb-2">
                            <Network className="w-8 h-8 text-cyber-primary" />
                            COLLUSION <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyber-primary">TOPOLOGY</span>
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm ml-11 max-w-2xl leading-relaxed">
                            Visualizing algorithmic linkage across the ledger space to identify multi-tenant fraud rings and synthetic identities.
                        </p>

                        <div className="ml-11 mt-4 flex flex-wrap items-center gap-4 text-[10px] font-bold tracking-widest uppercase">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyber-primary shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                <span className="text-gray-500">Host Business</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyber-alert shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                                <span className="text-cyber-alert">High-Risk Vendor</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)]"></div>
                                <span className="text-gray-500">Trusted Entity</span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 flex gap-2 p-1.5 bg-[#0a0f16]/80 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl">
                        <button onClick={handleZoomIn} className="p-3 text-gray-400 hover:text-white transition-colors rounded-lg bg-[#05080c] hover:bg-cyber-primary/20 border border-gray-800 hover:border-cyber-primary/40 group">
                            <ZoomIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <button onClick={handleZoomOut} className="p-3 text-gray-400 hover:text-white transition-colors rounded-lg bg-[#05080c] hover:bg-cyber-primary/20 border border-gray-800 hover:border-cyber-primary/40 group">
                            <ZoomOut className="w-4 h-4 group-hover:scale-90 transition-transform" />
                        </button>
                        <button onClick={handleFit} className="p-3 text-gray-400 hover:text-white transition-colors rounded-lg bg-[#05080c] hover:bg-cyber-primary/20 border border-gray-800 hover:border-cyber-primary/40 group">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    ref={containerRef}
                    className="flex-grow bg-[#05080c] border border-gray-800 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col"
                >
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05080c]/80 backdrop-blur-sm z-10">
                            <Loader2 className="w-12 h-12 text-cyber-primary animate-spin mb-6" />
                            <p className="text-cyber-primary animate-pulse font-mono tracking-widest text-sm font-bold">ANALYZING NETWORK TOPOLOGY...</p>
                        </div>
                    ) : graphData?.nodes.length ? (
                        <ForceGraph2D
                            ref={graphRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={graphData}
                            backgroundColor="#05080c"
                            nodeLabel="name"
                            nodeRelSize={6}
                            nodeColor={(n: any) => {
                                if (n.type === 'business') return '#3b82f6';
                                const risk = n.risk_score || 0;
                                if (risk > 0.7) return '#ef4444';
                                if (risk > 0.4) return '#f59e0b';
                                return '#10b981';
                            }}
                            linkColor={() => 'rgba(45, 212, 191, 0.15)'}
                            linkWidth={(l: any) => Math.min(l.tx_count || 1, 5) * 0.8}
                            linkDirectionalParticles={(l: any) => Math.min(l.tx_count || 1, 4)}
                            linkDirectionalParticleWidth={2}
                            linkDirectionalParticleColor={() => 'rgba(45, 212, 191, 0.4)'}
                            linkDirectionalParticleSpeed={0.005}
                            onNodeClick={handleNodeClick}
                            nodeCanvasObject={(node: any, ctx, globalScale) => {
                                const label = node.name;
                                const fontSize = 12 / globalScale;
                                ctx.font = `600 ${fontSize}px "JetBrains Mono", "Courier New", monospace`;
                                const textWidth = ctx.measureText(label).width;
                                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                                // Dark semi-transparent background for text
                                ctx.fillStyle = 'rgba(5, 8, 12, 0.9)';
                                ctx.beginPath();
                                ctx.roundRect(
                                    node.x - bckgDimensions[0] / 2,
                                    node.y - bckgDimensions[1] / 2 - 14,
                                    bckgDimensions[0],
                                    bckgDimensions[1],
                                    2 / globalScale
                                );
                                ctx.fill();

                                // Optional: subtle border around text box 
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                                ctx.lineWidth = 0.5 / globalScale;
                                ctx.stroke();

                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';

                                // Node Text Color Logic
                                if (node.type === 'business') {
                                    ctx.fillStyle = '#93c5fd';
                                } else {
                                    ctx.fillStyle = node.risk_score > 0.7 ? '#fca5a5' : node.risk_score > 0.4 ? '#fbbf24' : '#a7f3d0';
                                }
                                ctx.fillText(label, node.x, node.y - 14);

                                // Draw Core Node Circle
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, node.val * 2.5, 0, 2 * Math.PI, false);
                                ctx.fillStyle = node.color;
                                ctx.fill();

                                // Node Glow based on risk or business
                                if (node.type === 'business') {
                                    ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
                                    ctx.shadowBlur = 20;
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                } else if (node.type === 'vendor' && node.risk_score > 0.7) {
                                    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
                                    ctx.shadowBlur = 25;
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                            <Info className="w-12 h-12 text-gray-700 mb-4" />
                            <p className="font-mono text-sm tracking-wider uppercase">Insufficient telemetry to build network topology.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
