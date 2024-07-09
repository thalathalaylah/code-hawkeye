import {useEffect, useRef} from 'react';
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

interface FoldedGroup {
    id: NodeId,
    removedElements: cytoscape.CollectionReturnValue
    addedEdges: cytoscape.ElementDefinition[]
}

const GraphVisualization = () => {
    const containerRef = useRef(null)
    const cyRef = useRef<cytoscape.Core | null>(null)

    // 閉じたgroupを記録する
    // グラフ構造の描画に変更があっても、GraphVisualization自体の再描画は行われないためuseStateを使っても値が更新されない
    // そのため、letで情報を保持する必要がある
    let foldedGroups: FoldedGroup[] = []

    const layout = {
        name: 'breadthfirst',
        padding: 50,
        directed: true,
        circle: false,
        grid: true,
        animate: true
    }

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
                ['F']
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
            ),
            new Node(
                'F',
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
        })

        cy.on('tap', 'node', (evt) => {
            const node = evt.target
            if (node.isParent() || node.hasClass('collapsed-group')) {
                toggleGroupCollapse(node)
            }
        })

        cy.layout(layout).run()
        cyRef.current = cy;

        return () => {
            cy.destroy();
        };
    }, []);

    const toggleGroupCollapse = (groupNode: cytoscape.NodeSingular) => {
        const cy = cyRef.current
        if (!cy) return;
        const groupId = groupNode.id()
        const foldedGroupOpt = foldedGroups.find(f => f.id === groupId)

        if (foldedGroupOpt) {
            // Expand the group
            groupNode.removeClass('collapsed-group')
            foldedGroupOpt.removedElements.restore()
            foldedGroups = foldedGroups.filter(n => n.id !== groupId)
        } else {
            // Fold the group
            groupNode.addClass('collapsed-group')
            const eles = groupNode.children().remove()
            foldedGroups.push({
                id: groupId,
                removedElements: eles,
                addedEdges: []
            })
        }

        cy.layout(layout).run()
    }

    return (
        <div className="w-full h-96 border border-gray-300 rounded-lg">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};

export default GraphVisualization;