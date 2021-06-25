import { NodeData } from '../../types';
import { Graph, Model, Cell, Node, Edge, Addon } from '@antv/x6';
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
	onChange?: (data: {
		nodes: Node.Metadata[];
		edges: Edge.Metadata[];
	}) => void;

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
			connecting: {
				connector: 'smooth',
			},
			getHTMLComponent: (node: Node) => {
				return this.#htmlNode.render(node);
			},
			interacting: (cellView) => {
				const data = cellView.cell.getData<NodeData>();
				return { nodeMovable: false };
			},
		});
		this.#graph.on('cell:changed', () => {
			const { onChange } = this.#options;
			if (!onChange) return;
			const { cells } = this.#graph.toJSON();
			const nodes: Node.Metadata[] = [];
			const edges: Edge.Metadata[] = [];
			cells.forEach((cell) => {
				const { id, zIndex, shape, data } = cell;
				if (cell.shape === 'edge') {
					edges.push(cell);
				} else {
					nodes.push({
						...cell.position,
						...cell.size,
						id,
						shape,
						data,
						zIndex,
					});
				}
			});
			onChange({
				nodes,
				edges,
			});
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

	render(
		data: {
			nodes?: Node.Metadata[];
			edges?: Edge.Metadata[];
		},
		options?: Model.FromJSONOptions,
	) {
		const { nodes, edges } = data;
		nodes?.forEach((node) => {
			if (node.shape === 'html') {
				node.attrs = {
					body: {
						fill: 'transparent',
						strokeWidth: 0,
					},
				};
				node.html = {
					render: (node: any) => {
						return this.#htmlNode.render(node);
					},
					shouldComponentUpdate: (node: any) => {
						return node.hasChanged('data');
					},
				};
				if (!node.data) node.data = {};
			}
		});
		this.#graph.fromJSON(data, options);
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
