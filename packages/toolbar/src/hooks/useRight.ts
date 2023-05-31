import { useEffect, useState } from 'react';
import { isMobile } from '@aomao/engine';

const useRight = (button: React.MutableRefObject<HTMLDivElement | null>) => {
	const [isRight, setIsRight] = useState(false);

	useEffect(() => {
		if (button.current && isMobile) {
			const rect = button.current.getBoundingClientRect();
			const width = window.visualViewport?.width;
			setIsRight(!width ? true : rect.left > width / 2);
		}
	}, []);
	return isRight;
};

export default useRight;
