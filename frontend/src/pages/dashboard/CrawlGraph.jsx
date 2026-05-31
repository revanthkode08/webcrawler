import React, { useEffect, useRef, useState, useContext } from 'react';
import * as d3 from 'd3';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../api/client';
import { ArrowLeft, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const CrawlGraph = () => {
  const { crawlId } = useParams();
  const svgRef = useRef(null);
  const { token } = useContext(AuthContext);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const depthColors = {
    0: '#00d4aa',
    1: '#7c3aed',
    2: '#f97316',
    3: '#3b82f6',
    4: '#94a3b8'
  };

  const buildGraph = (data) => {
    const { nodes, edges } = data;
    setNodeCount(nodes.length);
    setEdgeCount(edges.length);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20).attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#475569');

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id).distance(80).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const link = g.append('g').selectAll('line')
      .data(edges).join('line')
      .attr('stroke', '#1e2035')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    const node = g.append('g').selectAll('g')
      .data(nodes).join('g')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', d => d.depth === 0 ? 14 : 8)
      .attr('fill', d => depthColors[Math.min(d.depth, 4)])
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => depthColors[Math.min(d.depth, 4)])
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.4);

    node.append('text')
      .attr('dy', d => d.depth === 0 ? -18 : -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.depth === 0 ? '11px' : '9px')
      .attr('fill', '#94a3b8')
      .text(d => d.label);

    node.append('title').text(d => `${d.id}\nDepth: ${d.depth}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    window.__graphZoom = zoom;
    window.__graphSvg = svg;
  };

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await authFetch(`/api/graph/${crawlId}`, token, { method:'GET' });
      buildGraph(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && crawlId) loadGraph();
    const interval = setInterval(() => {
      if (token && crawlId) loadGraph();
    }, 5000);
    return () => clearInterval(interval);
  }, [crawlId, token]);

  return (
    <div style={{ width:'100%', height:'100%' }}>
      <div className="page-header" style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <Link to="/dashboard/active-crawls" className="btn btn-outline"
            style={{ padding:'0.4rem 0.8rem' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2>Crawl Depth Graph</h2>
            <p>{nodeCount} nodes · {edgeCount} edges · auto-refreshes every 5s</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-outline" style={{ padding:'0.4rem 0.8rem' }}
            onClick={() => window.__graphSvg?.call(window.__graphZoom.scaleBy, 1.3)}>
            <ZoomIn size={16} />
          </button>
          <button className="btn btn-outline" style={{ padding:'0.4rem 0.8rem' }}
            onClick={() => window.__graphSvg?.call(window.__graphZoom.scaleBy, 0.7)}>
            <ZoomOut size={16} />
          </button>
          <button className="btn btn-outline" style={{ padding:'0.4rem 0.8rem' }}
            onClick={loadGraph}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'1.5rem', marginBottom:'1rem',
        fontSize:'0.8rem', color:'#94a3b8', flexWrap:'wrap' }}>
        {Object.entries(depthColors).map(([depth, color]) => (
          <span key={depth} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ width:10, height:10, borderRadius:'50%',
              background:color, display:'inline-block' }} />
            Depth {depth}{depth === '4' ? '+' : ''}
          </span>
        ))}
      </div>

      <div className="glass-panel" style={{ height:'600px', position:'relative',
        overflow:'hidden', borderRadius:'12px' }}>
        {loading && nodeCount === 0 && (
          <div style={{ position:'absolute', inset:0, display:'flex',
            alignItems:'center', justifyContent:'center', color:'#94a3b8' }}>
            Building graph...
          </div>
        )}
        <svg ref={svgRef} width="100%" height="100%"
          style={{ cursor:'grab' }} />
      </div>
    </div>
  );
};

export default CrawlGraph;
