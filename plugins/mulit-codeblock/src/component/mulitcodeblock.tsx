import React, { FC } from 'react';
import { MulitCodeProps } from './type';
import CopyIcon from './common/copy';
import {
	useContentResize,
	useMirrorEditor,
	useInitLanguage,
} from './utils/hook';

import MulitCodeblockDragBar from './common/dragBar';
import MulitCodeblockHeader from './common/header';

const MulitCodeComponent: FC<MulitCodeProps> = (props) => {
	const { options, value, editor } = props;
	const { listRef, currentRef, refreshList, refreshCurrent } =
		useInitLanguage(props);
	const { ref, mirror } = useMirrorEditor({
		props,
		list: listRef,
		current: currentRef,
		refreshList,
	});
	const { resizeMouseDown } = useContentResize({
		ref,
		mirror,
		onUpdateValue: options?.onUpdateValue,
	});

	return (
		<div className="mulit-code-block">
			<CopyIcon mirror={mirror.current} editor={editor} />
			{/* 配置头 */}
			<MulitCodeblockHeader
				initData={props}
				list={listRef.current}
				current={currentRef.current}
				refreshList={refreshList}
				refreshCurrent={refreshCurrent}
			/>
			{/* 代码展示的地方 */}
			<pre
				className="mulit-code-block-content"
				style={{ height: value.height }}
				ref={ref}
			/>
			{/* 拖动块 */}
			<MulitCodeblockDragBar resizeMouseDown={resizeMouseDown} />
		</div>
	);
};

export default MulitCodeComponent;
