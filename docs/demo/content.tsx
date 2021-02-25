import React, { useRef, useEffect } from 'react';
import { isBrowser } from 'umi';
import Engine, { $, View, ViewInterface } from '@aomao/engine';

const ContentRender = ({ content }: { content: string }) => {
	const view = useRef<ViewInterface>();
	const viewRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (viewRef.current && !view.current) {
			//初始化
			view.current = new View(viewRef.current, {
				card: Engine.card,
				plugin: Engine.plugin,
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
		const container = $('<div></div>');
		const view = new View(container, {
			card: Engine.card,
			plugin: Engine.plugin,
		});
		//渲染内容到container节点下
		view.render(content);
		return (
			<div
				className={container.attr('class')}
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
