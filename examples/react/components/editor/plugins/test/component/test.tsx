import { FC } from 'react';
import { TestValue } from './types';
const TestComponent: FC<{ value: TestValue }> = ({ value }) => (
	<div>{value.text}</div>
);
export default TestComponent;
