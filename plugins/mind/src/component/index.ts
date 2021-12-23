import { ShapeData } from '../types';
import { Node, Edge } from '@antv/x6';
import {
	$,
	Card,
	CardType,
	CardValue,
	isEngine,
	NodeInterface,
	Parser,
} from '@aomao/engine';
import GraphEditor from './editor';

export interface MindValue extends CardValue {
	data: Array<ShapeData>;
}

export default class MindCard extends Card<MindValue> {
	private graphEditor?: GraphEditor;

	static get cardName() {
		return 'mind';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	contenteditable = ['div.mind-content'];

	onChange(_: 'local' | 'remote', node: NodeInterface) {
		const height = node.height();
		const width = node.width();
		console.log(width, height);
		const { schema, conversion } = this.editor;
		const parser = new Parser(node.clone(true), this.editor);
		const value = parser.toValue(schema, conversion, false, true);
		this.graphEditor?.setEditableNodeValue(value);
	}

	render() {
		const height = 600;
		if (!this.graphEditor) {
			this.graphEditor = new GraphEditor(this.getCenter(), {
				height,
				onChange: (data) => {
					this.setValue({ data });
				},
			});
		}
		const value = this.getValue();
		const data = value?.data || [
			{
				id: 'main', // String，可选，节点的唯一标识
				shape: 'html',
				totalHeight: height,
				totalWidth: 690,
				x: 40, // Number，必选，节点位置的 x 值
				y: 40, // Number，必选，节点位置的 y 值
				width: 180, // Number，可选，节点大小的 width 值
				height: 40, // Number，可选，节点大小的 height 值
				data: {
					hierarchy: 1,
					value: `<p><span style="color:#ffffff"><span style="font-size:16px">思维导图</span></span></p>`,
					classNames: 'mind-main-node',
				},
			},
		];
		this.graphEditor.render(data);
	}

	didRender() {
		super.didRender();
		this.graphEditor?.didRender();
	}

	destroy() {
		this.graphEditor?.destroy();
		this.graphEditor = undefined;
	}
}
