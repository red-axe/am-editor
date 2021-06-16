import React, { useRef, useEffect, useState, useContext } from 'react';
import Message from 'antd/es/message';
import { View, ViewInterface, isServer } from '@aomao/engine';
import { plugins, cards } from '../editor/config';
import Loading from '../loading';
import Context from '../../context';
import 'antd/es/message/style';
import './index.less';

export type ViewProps = {
	content: string;
};
const viewPlugins = plugins.filter(
	(plugin) =>
		plugin.pluginName.indexOf('uploader') < 0 &&
		['mark-range'].indexOf(plugin.pluginName) < 0,
);

const ViewRender: React.FC<ViewProps> = ({ content }) => {
	const view = useRef<ViewInterface>();
	const viewRef = useRef<HTMLDivElement | null>(null);
	const [viewLoading, setViewLoading] = useState(true);
	const { lang } = useContext(Context);

	useEffect(() => {
		if (viewRef.current) {
			//初始化
			view.current = new View(viewRef.current, {
				lang,
				plugins: viewPlugins,
				cards,
			});
			view.current.messageSuccess = (msg: string) => {
				Message.success(msg);
			};
			view.current.messageError = (error: string) => {
				Message.error(error);
			};
			setViewLoading(false);
		}
	}, []);

	useEffect(() => {
		if (view.current) {
			//渲染内容到viewRef节点下
			view.current.render(content);
		}
	}, [content, viewLoading]);

	//服务端渲染
	const renderServer = () => {
		const view = new View('<div></div>', {
			lang,
			plugins: viewPlugins,
			cards,
		});
		//渲染内容到container节点下
		view.render(content);
		const { container } = view;
		return (
			<div
				className="editor-wrapper editor-wrapper-view"
				style={{ position: 'relative' }}
			>
				<div
					className={container.attributes('class')}
					dangerouslySetInnerHTML={{ __html: container.html() }}
				></div>
			</div>
		);
	};
	//普通渲染
	const render = () => {
		return (
			<div
				className="editor-wrapper editor-wrapper-view"
				style={{ position: 'relative' }}
			>
				<div className="am-engine-view" ref={viewRef} />
			</div>
		);
	};
	return (
		<Loading loading={viewLoading}>
			{!isServer ? render() : renderServer()}
		</Loading>
	);
};

export default ViewRender;
