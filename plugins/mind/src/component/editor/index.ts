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
	width?: number;
	height?: number;
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
			width: options.width,
			height: options.height || 600,
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
			if (onChange) onChange(this.getData());
		});

		this.#htmlNode = new HtmlNode(this.#graph, {
			onAdded: () => {
				console.log('added');
				const data = this.getData();
				const nodes = this.#graph.getNodes();
				const hierarchy = this.getHierarchy(data);
				/*const updatePosition = (data: Array<ShapeData>) => {
					data.forEach((item) => {
						const node = nodes.find((node) => node.id === item.id);
						if (node && node.parent) {
							const { x, y } = node.getBBox();
							const newX =
								item.x + item.data.width / 2 + item.hgap;
							const newY =
								item.y + item.data.height / 2 + item.vgap;
							if (newX !== x || newY !== y) {
								node.position(newX, newY, {
									relative: true,
									deep: true,
								});
							}
						}
						if (item.children) updatePosition(item.children);
					});
				};
				updatePosition(hierarchy);*/
			},
		});
		this.#dnd = new Addon.Dnd({
			target: this.#graph,
			getDragNode: (sourceNode) => sourceNode,
		});
		this.#graph.on('node:mousedown', ({ e, node }) => {
			//this.#dnd.start(node, e);
		});
	}

	getData() {
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

				const data = node.getData<NodeData>();
				return {
					id: node.id,
					x: bbox.x,
					y: bbox.y,
					width: bbox.width,
					height: bbox.height,
					data: node.getData<NodeData>(),
					children,
					hierarchy: data.hierarchy || 1,
				};
			};
			if (node.parent) return;
			data.push(getItem(node));
		});
		return data;
	}

	getHierarchy(data: Array<ShapeData>) {
		return data.map((data) =>
			Hierarchy.mindmap(data, {
				direction: 'H',
				getSubTreeSep: (node: ShapeData) => {
					if (node.children && node.children.length > 0) {
						if (node.data?.hierarchy && node.data?.hierarchy <= 2) {
							return 8;
						}
						return 2;
					}
					return 0;
				},
				getHGap: (node: ShapeData) => {
					if (node.data?.hierarchy && node.data?.hierarchy === 1) {
						return 8;
					}

					if (node.data?.hierarchy && node.data?.hierarchy === 2) {
						return 24;
					}

					return 18;
				},
				getVGap: (node: ShapeData) => {
					if (node.data?.hierarchy && node.data?.hierarchy === 1) {
						return 8;
					}

					if (node.data?.hierarchy && node.data?.hierarchy === 2) {
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
			}),
		);
	}

	setEditableNodeValue(value: string) {
		if (!this.#editableCell) return;
		this.#editableCell.setData({ value }, { silent: true });
	}

	render(data: Array<ShapeData>) {
		const getNode = (item: any): Node.Metadata => {
			const newX = item.x + item.data.width / 2 + item.hgap;
			const newY = item.y + item.data.height / 2 + item.vgap;
			return {
				...item,
				x: newX,
				y: newY,
				data: item.data.data,
				shape: 'html',
				attributes: {
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
		const hierarchyData = this.getHierarchy(data);
		hierarchyData.forEach((hierarchy) => {
			const node = this.#graph.addNode(getNode(hierarchy));

			const appendChild = (root: Node, item: any) => {
				item.children?.forEach((child: any) => {
					const node = this.#graph.addNode(getNode(child));
					root.addChild(node);
					appendChild(node, child);
				});
			};
			appendChild(node, hierarchy);
		});
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
