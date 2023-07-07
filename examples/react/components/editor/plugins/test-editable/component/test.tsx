import React, { FC } from 'react';
import { TestEditableValue } from './types';
const TestEditableComponent: FC<{ value: TestEditableValue }> = ({ value }) => (
	<div style={{ display: 'flex' }}>
		<div
			className="editable-container editable-container-left"
			style={{ backgroundColor: 'black', color: '#fff' }}
			// 必须
			contentEditable="true"
			// 必须
			data-element="editable"
			dangerouslySetInnerHTML={{ __html: value.left }}
		/>
		<div
			className="editable-container editable-container-right"
			style={{ backgroundColor: 'yellow', flex: 1 }}
			// 必须
			contentEditable="true"
			// 必须
			data-element="editable"
			dangerouslySetInnerHTML={{ __html: value.right }}
		/>
	</div>
);
export default TestEditableComponent;
