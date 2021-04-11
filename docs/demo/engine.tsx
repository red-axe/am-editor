import React, { useEffect, useRef, useState } from 'react';
import { Avatar } from 'antd';
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
import Image, { ImageComponent, ImageUploader } from '@aomao/plugin-image';

import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
import OTClient from './ot-client';
import 'antd/lib/avatar/style';
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
	Image,
	ImageUploader,
	ToolbarPlugin,
];
const cards = [
	HrComponent,
	CheckboxComponent,
	CodeBlockComponent,
	ToolbarComponent,
	ImageComponent,
];

const isDev = process.env.NODE_ENV !== 'production';
const domain = isDev ? 'http://localhost:7001' : 'https://editor.aomao.com';

const EngineDemo = () => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [engine, setEngine] = useState<EngineInterface>();
	const [content, setContent] = useState<string>(
		`<p data-id="daab65504017af77a36594f98ab4875d">Hello<strong>AoMao</strong></p><card type="block" name="hr" value="data:%7B%22id%22%3A%22eIxTM%22%7D"></card>`,
	);
	const [members, setMembers] = useState([]);

	useEffect(() => {
		if (!ref.current) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins,
			cards,
			config: {
				[ImageUploader.pluginName]: {
					file: {
						action: `${domain}/upload/image`,
					},
					remote: {
						action: `${domain}/upload/image`,
					},
					isRemote: (src: string) => src.indexOf(domain) < 0,
				},
			},
		});
		//初始化本地协作，用作记录历史
		engine.ot.initLockMode();

		//设置编辑器值
		engine.setValue(content);
		//监听编辑器值改变事件
		engine.on('change', value => {
			setContent(value);
			console.log('value', value);
			console.log('html:', engine.getHtml());
		});
		//获取当前保存的用户信息
		const memberData = localStorage.getItem('member');
		const currentMember = !!memberData ? JSON.parse(memberData) : null;
		//实例化协作编辑客户端
		const otClient = new OTClient(engine);
		//连接到协作服务端，demo文档
		const ws = isDev ? 'ws://127.0.0.1:8080' : 'wss://collab.aomao.com';
		otClient.connect(
			`${ws}${currentMember ? '?uid=' + currentMember.id : ''}`,
			'demo',
		);
		otClient.on('ready', member => {
			//保存当前会员信息
			if (member) localStorage.setItem('member', JSON.stringify(member));
		});
		//用户加入或退出改变
		otClient.on('membersChange', members => {
			setMembers(members);
		});
		setEngine(engine);
	}, []);

	return (
		<>
			<div className="editor-ot-users">
				<p style={{ color: '#888888' }}>
					当前在线用户：<strong>{members.length}</strong> 人
				</p>
				<div className="editor-ot-users-content">
					{members.map(member => {
						return (
							<Avatar
								key={member['id']}
								size={30}
								style={{ backgroundColor: member['color'] }}
							>
								{member['name']}
							</Avatar>
						);
					})}
				</div>
			</div>
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
			<div className="editor-wrapper">
				<div className="editor-container">
					<div ref={ref} />
				</div>
			</div>
		</>
	);
};

export default EngineDemo;
