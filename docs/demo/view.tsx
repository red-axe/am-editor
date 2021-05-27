import React, { useRef, useEffect, useCallback, useState } from 'react';
import { isBrowser } from 'umi';
import Message from 'antd/lib/message';
import { View, ViewInterface, Request } from '@aomao/engine';
import { DOMAIN, cards, plugins, lang } from './config';
import Loading from '../demo/loading';
import 'antd/lib/message/style';

const viewPlugins = plugins.filter(
	plugin => ['image-uploader', 'mark-range'].indexOf(plugin.pluginName) < 0,
);

const ViewRender = () => {
	const view = useRef<ViewInterface>();
	const viewRef = useRef<HTMLDivElement | null>(null);
	const request = useRef(new Request());
	const [loading, setLoading] = useState(true);
	const [viewLoading, setViewLoading] = useState(true);
	const [content, setContent] = useState('');

	/**
	 * 加载编辑数据
	 */
	const load = useCallback(() => {
		request.current
			.ajax({
				url: `${DOMAIN}/doc/get`,
			})
			.then(({ code, data }: any) => {
				if (code === 200) {
					setContent(data.value);
				} else {
					Message.error('加载出错了');
				}
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		load();
	}, []);

	useEffect(() => {
		if (viewRef.current && !loading) {
			//初始化
			view.current = new View(viewRef.current, {
				lang,
				plugins: viewPlugins,
				cards,
			});
			setViewLoading(false);
		}
	}, [loading]);

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
			<div className="editor-wrapper" style={{ position: 'relative' }}>
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
			<div className="editor-wrapper" style={{ position: 'relative' }}>
				<div className="am-engine-view" ref={viewRef} />
			</div>
		);
	};
	return (
		<Loading loading={loading}>
			{isBrowser() ? render() : renderServer()}
		</Loading>
	);
};

export default ViewRender;
