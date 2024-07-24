import {useEffect, useRef} from 'react';
import cytoscape from 'cytoscape';
import GraphManipulator from "./graph-manipulation/GraphManipulator.ts";

const DependencyGraph = () => {
    const containerRef = useRef(null)
    const cyRef = useRef<cytoscape.Core | null>(null)

    const layout = {
        name: 'breadthfirst',
        padding: 50,
        directed: true,
        circle: false,
        grid: true,
        animate: true
    }

    useEffect(() => {
        const m = new GraphManipulator(layout, containerRef)
        cyRef.current = m.getCy()
        return () => {
            m.getCy().destroy();
        };
    }, []);

    return (
        <div className="w-full h-96 border border-gray-300 rounded-lg">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};

export default DependencyGraph;