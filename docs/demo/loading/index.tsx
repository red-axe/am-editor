import React from 'react';
import Spin from 'antd/lib/spin';
import 'antd/lib/spin/style/css';
import './index.css';

const Loading: React.FC<{ text?: string }> = ({ text, children }) => {
	return (
		<div className="loading">
			<Spin tip={text}>{children}</Spin>
		</div>
	);
};

export default Loading;
