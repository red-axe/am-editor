import React, {
	useEffect,
	useRef,
	useImperativeHandle,
	forwardRef,
} from 'react';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Engine, { EngineInterface, EngineOptions } from '@aomao/engine';
import 'antd/es/message/style';
import 'antd/es/modal/style';

export type EngineProps = EngineOptions & {
	defaultValue?: string;
	onChange?: (trigger: 'remote' | 'local' | 'both') => void;
	ref?: React.Ref<EngineInterface | null>;
};
message.config({
	top: 240,
	duration: 3,
});
const EngineComponent: React.FC<EngineProps> = forwardRef<
	EngineInterface | null,
	EngineProps
>(({ defaultValue, onChange, ...options }, ref) => {
	const container = useRef<HTMLDivElement | null>(null);
	const engineRef = useRef<EngineInterface | null>(null);

	const init = () => {
		if (!container.current) return null;

		const engine = new Engine(container.current, options);

		engine.messageSuccess = (msg: string) => {
			message.success(msg);
		};
		engine.messageError = (error: string) => {
			message.error(error);
		};
		engine.messageConfirm = (msg: string) => {
			return new Promise<boolean>((resolve, reject) => {
				Modal.confirm({
					content: msg,
					onOk: () => resolve(true),
					onCancel: () => reject(),
				});
			});
		};

		engineRef.current = engine;
		return engine;
	};

	useEffect(() => {
		return () => {
			engineRef.current?.destroy();
		};
	}, []);

	const change = (trigger: 'remote' | 'local' | 'both') => {
		if (onChange) onChange(trigger);
	};

	useEffect(() => {
		// 监听编辑器值改变事件
		engineRef.current?.on('change', change);
		return () => {
			engineRef.current?.off('change', change);
		};
	}, [onChange]);

	useImperativeHandle<EngineInterface | null, EngineInterface | null>(
		ref,
		() => {
			return init();
		},
		[],
	);

	return <div ref={container}></div>;
});

export default EngineComponent;
