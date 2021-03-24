import React, { useRef, useEffect } from 'react';
import { isBrowser } from 'umi';
import { View, ViewInterface, CardEntry, PluginEntry } from '@aomao/engine';

const ContentRender = ({
	content,
	plugins,
	cards,
}: {
	content: string;
	plugins?: PluginEntry[];
	cards?: CardEntry[];
}) => {
	const view = useRef<ViewInterface>();
	const viewRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (viewRef.current && !view.current) {
			//初始化
			view.current = new View(viewRef.current, {
				plugins,
				cards,
			});
		}
	}, []);

	useEffect(() => {
		if (view.current) {
			//渲染内容到viewRef节点下
			view.current.render(content);
		}
	}, [content]);

	//服务端渲染
	const renderServer = () => {
		const view = new View('<div></div>', {
			plugins,
			cards,
		});
		//渲染内容到container节点下
		view.render(content);
		const { container } = view;
		return (
			<div
				className={container.attributes('class')}
				dangerouslySetInnerHTML={{ __html: container.html() }}
			></div>
		);
	};
	//普通渲染
	const render = () => {
		return <div ref={viewRef} />;
	};
	return isBrowser() ? render() : renderServer();
};

export default ContentRender;
