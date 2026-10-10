"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataUnavailable } from '@/components/ui/DataUnavailable';
import type { GraphData } from '@/components/charts/NetworkGraph';

// Lazy-load the force-graph canvas component — it pulls in react-force-graph-2d
// and d3-force-3d which are large and require a browser environment.
const NetworkGraph = dynamic(() => import('@/components/charts/NetworkGraph'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full glass rounded-3xl flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading Graph Engine...
      </p>
    </div>
  ),
});

export default function NetworkPage() {
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchGraphData() {
            try {
                const res = await fetch('/api/network-graph');
                if (!res.ok) throw new Error('Failed to fetch graph data');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        }
        fetchGraphData();
    }, []);

    return (
        <div>
            <PageHeader
                eyebrow="Network data"
                title="Network graph"
                description="Anchors, the assets they issue and the corridors between them. Line thickness follows settled volume; colour follows success rate."
                actions={
                    data && (
                        <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted-foreground">
                            {data.nodes.length} nodes · {data.links.length} links
                        </span>
                    )
                }
            />

            <div className="relative h-[calc(100vh-320px)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-card">
                {loading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
                        <p className="text-sm text-muted-foreground">Laying out the graph…</p>
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center p-6">
                        <DataUnavailable what="the network graph" onRetry={() => window.location.reload()} />
                    </div>
                ) : data ? (
                    <NetworkGraph data={data} />
                ) : null}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
                Drag nodes to rearrange, scroll to zoom, and hover for details.
            </p>
        </div>
    );
}
