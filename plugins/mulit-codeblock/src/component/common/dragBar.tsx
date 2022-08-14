import React from 'react';

interface IDragBar {
	resizeMouseDown?: (e: React.MouseEvent) => void;
}

export default function DragBar({ resizeMouseDown }: IDragBar) {
	return (
		<div className="mulit-code-block-resize">
			<span
				className="mulit-code-block-resize-btn"
				onMouseDown={resizeMouseDown}
			>
				<svg
					viewBox="0 0 3413 1024"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					fill="currentColor"
					width="8px"
					height="6px"
				>
					<path d="M341.333333 341.333333h2730.666667a170.666667 170.666667 0 0 0 0-341.333333H341.333333a170.666667 170.666667 0 1 0 0 341.333333zM341.333333 1024h2730.666667a170.666667 170.666667 0 0 0 0-341.333333H341.333333a170.666667 170.666667 0 0 0 0 341.333333z" />
				</svg>
			</span>
		</div>
	);
}
