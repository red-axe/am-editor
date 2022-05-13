import React, { useRef, useEffect, useState, useContext } from 'react';
import Message from 'antd/es/message';
import { $, View, ViewInterface } from '@aomao/engine';
import { plugins, cards } from '../editor/config';
import Loading from '../loading';
import Context from '../../context';
import 'antd/es/message/style';
import './index.less';

export type ViewProps = {
	content: string;
	html: string;
};
const viewPlugins = plugins.filter(
	(plugin) =>
		plugin.pluginName.indexOf('uploader') < 0 &&
		['mark-range'].indexOf(plugin.pluginName) < 0,
);

const ViewRender: React.FC<ViewProps> = ({ content, html }) => {
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
				config: {
					table: {
						overflow: {
							maxLeftWidth: () => {
								return 0;
							},
							maxRightWidth: () => {
								// 编辑区域位置
								const wrapper = $('.editor-wrapper-view');
								const view = $('.am-engine-view');
								const wRect = wrapper
									.get<HTMLElement>()
									?.getBoundingClientRect();
								const vRect = view
									.get<HTMLElement>()
									?.getBoundingClientRect();
								const width =
									(wRect?.width || 0) - (vRect?.width || 0);
								return width <= 0 ? 100 : width;
							},
						},
					},
				},
			});
			view.current.messageSuccess = (
				type: string,
				msg: string,
				...args: any[]
			) => {
				console.log(type, msg, ...args);
				Message.success(msg);
			};
			view.current.messageError = (
				type: string,
				error: string,
				...args: any[]
			) => {
				console.error(type, error, ...args);
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
	return <Loading loading={viewLoading}>{render()}</Loading>;
};

export default ViewRender;
