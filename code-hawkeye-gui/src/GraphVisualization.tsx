import {useEffect, useRef, useState} from 'react';
import cytoscape from 'cytoscape';
import {Option} from "effect";

type NodeId = string;

class Node {
    constructor(
        private readonly id: NodeId,
        private readonly label: Option.Option<string>,
        private readonly parentId: Option.Option<NodeId>,
        private readonly dependencies: NodeId[]
    ) {}

    getElements(): cytoscape.ElementDefinition[] {
        const edges = this.getEdges()
        edges.push(this.getNode())
        return edges
    }

    private getNode(): cytoscape.ElementDefinition {
        return {
            data: {
                id: this.id,
                label: Option.getOrElse(this.label, () => undefined),
                parent: Option.getOrElse(this.parentId, () => undefined)
            }
        }
    }

    private getEdges(): cytoscape.ElementDefinition[] {
        return this.dependencies.map(d => {
            return {
                data: {
                    id: this.id + '-' + d,
                    source: this.id,
                    target: d
                }
            }
        })
    }
}

const GraphVisualization = () => {
    const containerRef = useRef(null)
    const cyRef = useRef<cytoscape.Core | null>(null)
    const [collapsedGroups, setCollapsedGroups] =
        useState<Set<[string, cytoscape.CollectionReturnValue]>>(new Set())

    useEffect(() => {
        const nodes: Node[] = [
            new Node(
                'group2',
                Option.none(),
                Option.none(),
                []
            ),
            new Node(
                'group1',
                Option.some('Group1'),
                Option.some('group2'),
                []
            ),
            new Node(
                'A',
                Option.none(),
                Option.none(),
                ['B']
            ),
            new Node(
                'B',
                Option.none(),
                Option.none(),
                ['C']
            ),
            new Node(
                'C',
                Option.none(),
                Option.some('group2'),
                []
            ),
            new Node(
                'D',
                Option.none(),
                Option.some('group1'),
                ['C']
            ),
            new Node(
                'E',
                Option.none(),
                Option.some('group1'),
                ['C', 'D']
            )
        ];

        const cy = cytoscape({
            container: containerRef.current,
            elements: nodes.map(n => n.getElements()).flat(),
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#6366f1',
                        'label': 'data(id)',
                        'color': '#ffffff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#94a3b8',
                        'target-arrow-color': '#94a3b8',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                },
                {
                    selector: '#D, #E',
                    style: {
                        'background-color': '#10b981',
                    }
                },
                {
                    selector: '$node > node',
                    style: {
                        'padding-top': '10px',
                        'padding-left': '10px',
                        'padding-bottom': '10px',
                        'padding-right': '10px',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'background-color': '#f1f5f9',
                        'color': '#475569',
                        'shape': 'roundrectangle',
                        'font-size': '12px',
                        'font-weight': 'bold'
                    }
                },
                {
                    selector: '.collapsed-group',
                    style: {
                        'shape': 'rectangle',
                        'background-color': '#cbd5e1',
                        'content': 'data(id)',
                    }
                }
            ],
            layout: {
                name: 'cose',
                padding: 50,
                componentSpacing: 100,
                nodeOverlap: 20,
                animate: false
            }
        })

        cy.on('tap', 'node', (evt) => {
            const node = evt.target
            if (node.isParent() || node.hasClass('collapsed-group')) {
                toggleGroupCollapse(node)
            }
        })

        cyRef.current = cy;

        return () => {
            cy.destroy();
        };
    }, []);

    const toggleGroupCollapse = (groupNode: cytoscape.NodeSingular) => {
        const cy = cyRef.current
        if (!cy) return;
        const groupId = groupNode.id()
        const collapsedNodesOpt = Array.from(collapsedGroups).find(n => {
            return n[0] === groupId
        })
        if (collapsedNodesOpt) {
            // Expand the group
            groupNode.removeClass('collapsed-group')
            collapsedNodesOpt[1].restore()
            setCollapsedGroups((() => {
                collapsedGroups.delete(collapsedNodesOpt)
                return collapsedGroups
            })())
        } else {
            // Collapse the group
            groupNode.addClass('collapsed-group')
            const eles = groupNode.children().remove()
            setCollapsedGroups(collapsedGroups.add([groupId, eles]))
        }

        cy.layout({ name: 'cose', animate: false }).run()
    }

    return (
        <div className="w-full h-96 border border-gray-300 rounded-lg">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};

export default GraphVisualization;