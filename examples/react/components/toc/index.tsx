import React, {
	useRef,
	useEffect,
	useState,
	useCallback,
	useContext,
} from 'react';
import { $, EditorInterface } from '@aomao/engine';
import { Outline, OutlineData } from '@aomao/plugin-heading';
import context from '../../context';
import './index.css';

type Props = {
	editor: EditorInterface;
};

const outline = new Outline();

const Toc: React.FC<Props> = ({ editor }) => {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const [datas, setDatas] = useState<Array<OutlineData>>([]);

	const { lang } = useContext(context);

	useEffect(() => {
		const onChange = () => {
			const data = getTocData();
			setDatas(data);
		};
		editor.on('change', onChange);
		editor.on('afterSetValue', onChange);
		return () => {
			editor.off('change', onChange);
			editor.off('afterSetValue', onChange);
		};
	}, [editor]);

	const getTocData = useCallback(() => {
		// 从编辑区域提取符合结构要求的标题 Dom 节点
		let nodes: Array<Element> = [];
		const { card } = editor;
		editor.container.find('h1,h2,h3,h4,h5,h6').each((child) => {
			const node = $(child);
			// Card 里的标题，不纳入大纲
			if (card.closest(node)) {
				return;
			}
			// 非一级深度标题，不纳入大纲
			if (!node.parent()?.isRoot()) {
				return;
			}
			nodes.push(node.get<Element>()!);
		});
		return outline.normalize(nodes);
	}, []);

	return (
		<div className="data-toc-wrapper">
			<div className="data-toc-title">
				{lang === 'zh-CN' ? '大纲' : 'Outline'}
			</div>
			<div className="data-toc" ref={rootRef}>
				{datas.map((data, index) => {
					return (
						<a
							key={index}
							href={'#' + data.id}
							className={`data-toc-item data-toc-item-${data.depth}`}
						>
							{data.text}
						</a>
					);
				})}
			</div>
		</div>
	);
};
export default Toc;
