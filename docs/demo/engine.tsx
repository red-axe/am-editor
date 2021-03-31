import React, { useEffect, useRef, useState } from 'react';
import Engine, { EngineInterface } from '@aomao/engine';
import Redo from '@aomao/plugin-redo';
import Undo from '@aomao/plugin-undo';
import Bold from '@aomao/plugin-bold';
import Code from '@aomao/plugin-code';
import Backcolor from '@aomao/plugin-backcolor';
import Fontcolor from '@aomao/plugin-fontcolor';
import Fontsize from '@aomao/plugin-fontsize';
import Italic from '@aomao/plugin-italic';
import Underline from '@aomao/plugin-underline';
import Hr, { HrComponent } from '@aomao/plugin-hr';
import Tasklist, { CheckboxComponent } from '@aomao/plugin-tasklist';
import Orderedlist from '@aomao/plugin-orderedlist';
import Unorderedlist from '@aomao/plugin-unorderedlist';
import Indent from '@aomao/plugin-indent';
import Heading from '@aomao/plugin-heading';
import Strikethrough from '@aomao/plugin-strikethrough';
import Sub from '@aomao/plugin-sub';
import Sup from '@aomao/plugin-sup';
import Alignment from '@aomao/plugin-alignment';
import Mark from '@aomao/plugin-mark';
import Quote from '@aomao/plugin-quote';
import PaintFormat from '@aomao/plugin-paintformat';
import RemoveFormat from '@aomao/plugin-removeformat';
import SelectAll from '@aomao/plugin-selectall';
import Link from '@aomao/plugin-link';
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock';
import Toolbar from '@aomao/toolbar';
import Content from './content';
import OTClient from './ot-client';
import './engine.less';

const plugins = [
	Redo,
	Undo,
	Bold,
	Code,
	Backcolor,
	Fontcolor,
	Fontsize,
	Italic,
	Underline,
	Hr,
	Tasklist,
	Orderedlist,
	Unorderedlist,
	Indent,
	Heading,
	Strikethrough,
	Sub,
	Sup,
	Alignment,
	Mark,
	Quote,
	PaintFormat,
	RemoveFormat,
	SelectAll,
	Link,
	Codeblock,
];
const cards = [HrComponent, CheckboxComponent, CodeBlockComponent];
const EngineDemo = () => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [engine, setEngine] = useState<EngineInterface>();
	const [content, setContent] = useState<string>(
		`<p data-id="daab65504017af77a36594f98ab4875d">Hello<strong>AoMao</strong></p><card type="block" name="hr" value="data:%7B%22id%22%3A%22eIxTM%22%7D"></card>`,
	);

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins,
			cards,
		});
		//初始化本地协作，用作记录历史
		engine.ot.initLockMode();
		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', value => {
			setContent(value);
			console.log(`value:${value}`);
		});
		//实例化协作编辑客户端
		const otClient = new OTClient(engine);
		//连接到协作服务端，demo文档
		otClient.connect('ws://127.0.0.1:8080', 'demo');

		setEngine(engine);
	}, []);

	return (
		<div>
			{engine && (
				<Toolbar
					engine={engine}
					items={[
						['collapse'],
						['undo', 'redo', 'paintformat', 'removeformat'],
						['heading', 'fontsize'],
						[
							'bold',
							'italic',
							'strikethrough',
							'underline',
							'moremark',
						],
						['fontcolor', 'backcolor'],
						['alignment'],
						['unorderedlist', 'orderedlist', 'tasklist', 'indent'],
						['link', 'quote', 'hr'],
					]}
				/>
			)}
			<div className="editor-container">
				<div ref={ref} />
			</div>
			<h4>View:</h4>
			<Content content={content} plugins={plugins} cards={cards} />
		</div>
	);
};

export default EngineDemo;
