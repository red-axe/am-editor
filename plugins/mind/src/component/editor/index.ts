import { NodeData, ShapeData } from '../../types';
import { Graph, Model, Cell, Node, Edge, Addon } from '@antv/x6';
import Hierarchy from '@antv/hierarchy';
import { $, DATA_ELEMENT, NodeInterface, UI } from '@aomao/engine';
import HtmlNode from './html-node';
import './index.css';

/*let GraphMoudle
if (!isServer) {
	import('@antv/x6').then(moudle => {
		GraphMoudle = moudle
	});
}*/

export type Options = {
	onChange?: (data: Array<ShapeData>) => void;

	onSelectedEditable?: (cell: Cell) => void;
};

class GraphEditor {
	#options: Options;
	#editableCell?: Cell;
	#htmlNode: HtmlNode;
	#graph: Graph;
	#dnd: Addon.Dnd;

	constructor(container: NodeInterface, options: Options) {
		this.#options = options;
		this.#graph = new Graph({
			container: container.get<HTMLElement>()!,
			height: 600,
			selecting: {
				enabled: true,
			},
			getHTMLComponent: (node: Node) => {
				return this.#htmlNode.render(node);
			},
			interacting: ({ cell }) => {
				if (cell.isNode() && cell.id === 'main') return true;
				return { nodeMovable: false, edgeMovable: false };
			},
		});
		this.#graph.on('cell:changed', () => {
			const { onChange } = this.#options;
			if (!onChange) return;
			console.log('changed');
			const nodes = this.#graph.getNodes();
			const data: Array<ShapeData> = [];
			nodes.forEach((node) => {
				if (!node.isNode()) return;
				const getItem = (node: Cell) => {
					const bbox = node.getBBox();
					const children: Array<ShapeData> = [];
					node.children?.forEach((child) => {
						if (!child.isNode()) return;
						children.push(getItem(child));
					});
					return {
						id: node.id,
						x: bbox.x,
						y: bbox.y,
						width: bbox.width,
						height: bbox.height,
						data: node.getData<NodeData>(),
						children,
						zIndex: node.getZIndex() || 1,
					};
				};
				data.push(getItem(node));
			});
			console.log(data);
			onChange(data);
		});
		this.#graph.on('node:added', ({ node }) => {
			console.log('added');
			const { parent } = node;
			if (parent) {
			}
		});
		this.#htmlNode = new HtmlNode(this.#graph);
		this.#dnd = new Addon.Dnd({
			target: this.#graph,
			getDragNode: (sourceNode) => sourceNode,
		});
		this.#graph.on('node:mousedown', ({ e, node }) => {
			//this.#dnd.start(node, e);
		});
	}

	setEditableNodeValue(value: string) {
		if (!this.#editableCell) return;
		this.#editableCell.setData({ value }, { silent: true });
	}

	render(data: Array<ShapeData>) {
		const hierarchyData = Hierarchy.mindmap(data[0], {
			direction: 'H',
			getSubTreeSep: (node: ShapeData) => {
				if (node.children && node.children.length > 0) {
					if (node.zIndex <= 2) {
						return 8;
					}
					return 2;
				}
				return 0;
			},
			getHGap: (node: ShapeData) => {
				if (node.zIndex === 1) {
					return 8;
				}

				if (node.zIndex === 2) {
					return 24;
				}

				return 18;
			},
			getVGap: (node: ShapeData) => {
				if (node.zIndex === 1) {
					return 8;
				}

				if (node.zIndex === 2) {
					return 12;
				}

				return 2;
			},
			getSide: (node: ShapeData) => {
				/*if (node.data.side) {
                    return node.data.side
                }*/

				return 'right';
			},
		});
		const getNode = (item: any): Node.Metadata => {
			return {
				...item,
				data: item.data.data,
				shape: 'html',
				attrs: {
					body: {
						fill: 'transparent',
						strokeWidth: 0,
					},
				},
				html: {
					render: (node: Node) => {
						return this.#htmlNode.render(node);
					},
					shouldComponentUpdate: (node: Node) => {
						return node.hasChanged('data');
					},
				},
			};
		};
		const metadata = getNode(hierarchyData);
		console.log(metadata);
		const node = this.#graph.addNode(getNode(hierarchyData));

		const appendChild = (root: Node, item: any) => {
			item.children?.forEach((child: any) => {
				const node = this.#graph.addNode(getNode(child));
				root.addChild(node);
				appendChild(node, child);
			});
		};
		appendChild(node, hierarchyData);
	}

	didRender() {
		this.#graph.on('node:dblclick', ({ cell }) => {
			if (cell.shape !== 'html') return;
			cell.setData({ editable: true });
			console.log('node:dblclick');
			this.#editableCell = cell;
			const { onSelectedEditable } = this.#options;
			if (onSelectedEditable) onSelectedEditable(cell);
		});
		this.#graph.on('node:unselected', () => {
			console.log('node:unselected');
			this.#editableCell?.setData({ editable: false });
			this.#editableCell = undefined;
		});
	}

	destroy() {
		this.#graph.dispose();
	}
}

export default GraphEditor;
