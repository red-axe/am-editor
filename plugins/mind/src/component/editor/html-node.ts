import { NodeData } from '../../types';
import { Graph, Node, Cell } from '@antv/x6';
import { $, DATA_ELEMENT, EDITABLE } from '@aomao/engine';

const template = `<div class="mind-container" readonly="true">
    <div class="mind-body">
        <div class="mind-content" ${DATA_ELEMENT}="${EDITABLE}"></div>
    </div>
    <div class="mind-tool-add">
        add
    </div>
</div>`;

export type Options = {
	onAdded?: (node: Node) => void;
};

class HtmlNode {
	graph: Graph;
	#options: Options;

	constructor(graph: Graph, options: Options) {
		this.graph = graph;
		this.#options = options;
	}

	/**
	 * 获取可编辑节点
	 * @param node 节点
	 * @returns
	 */
	getEditableElement(node: Cell) {
		const container = node.findView(this.graph)?.container;
		if (!container) return;
		return $(container).find('div.mind-content');
	}

	getNodeConfig(
		options: {
			x: number;
			y: number;
			width?: number;
			height?: number;
		} & NodeData,
	): Node.Metadata {
		const { x, y, width, height, ...data } = options;
		return {
			shape: 'html',
			x, // Number，必选，节点位置的 x 值
			y, // Number，必选，节点位置的 y 值
			width: width || 16, // Number，可选，节点大小的 width 值
			height: height || 24, // Number，可选，节点大小的 height 值
			attributes: {
				body: {
					fill: 'transparent',
					strokeWidth: 0,
				},
			},
			data: {
				...data,
			},
			html: {
				render: (node: any) => {
					return this.render(node);
				},
				shouldComponentUpdate: (node: any) => {
					return node.hasChanged('data');
				},
			},
		};
	}

	render(node: Node) {
		const data = node.getData<NodeData>();

		const { value, editable, attributes, styles, classNames } = data;
		const base = $(template);
		const body = base.find('.mind-body');

		const editableElement = base.find('.mind-content');
		editableElement.each((element) => {
			const node = $(element);
			node.attributes('contenteditable', `${!!editable}`);
			node.closest('.mind-container')?.attributes(
				'readonly',
				`${!editable}`,
			);
			editableElement.html(value || '<p>Heelo</p>');
			if (editable) {
				setTimeout(() => {
					node.get<HTMLElement>()?.focus();
				}, 50);
			}
		});

		Object.keys(attributes || {}).forEach((name) => {
			body.attributes(name, attributes![name]);
		});
		Object.keys(styles || {}).forEach((name) => {
			body.css(name, styles![name]);
		});
		if (Array.isArray(classNames)) {
			classNames.forEach((className) => {
				body.addClass(className);
			});
		} else if (typeof classNames === 'string') {
			body.addClass(classNames);
		}
		const addTool = base.find('.mind-tool-add');
		addTool.on('click', () => {
			const bbox = node.getBBox();
			const data = node.getData<NodeData>();
			const edgeBeginX = bbox.x + bbox.width - 5;
			const edgeBeginY = bbox.y + bbox.height / 2;
			const nodeX = bbox.x + bbox.width + 80;
			const nodeY = bbox.y - 80;

			const target = this.graph.addNode(
				this.getNodeConfig({
					x: nodeX,
					y: nodeY,
					width: 60,
					height: 25,
					hierarchy: (data.hierarchy || 0) + 1,
				}),
			);
			node.addChild(target);
			const { onAdded } = this.#options;
			if (onAdded) onAdded(target);
			/*const targetBBox = target.getBBox();
			const edgeEndX = nodeX + targetBBox.width;
			const edgeEndY = nodeY + targetBBox.height + 4;
			const edge = this.graph.addEdge({
				shape: 'edge', // 指定使用何种图形，默认值为 'edge'
				source: { x: edgeBeginX, y: edgeBeginY },
				target: { x: edgeEndX, y: edgeEndY },
				vertices: [
					{
						x: edgeBeginX + 18,
						y: edgeBeginY - 24,
					},
					{
						x: edgeBeginX + 24 + 18,
						y: edgeEndY,
					},
				],
				connector: {
					name: 'rounded',
					args: {
						radius: 20,
					},
				},
				attributes: {
					line: {
						stroke: '#ccc',
						strokeWidth: 3,
						targetMarker: null,
					},
				},
			});
			node.addChild(edge);*/
		});
		return base.get<HTMLElement>()!;
	}
}

export default HtmlNode;
