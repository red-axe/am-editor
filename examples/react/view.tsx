import React, { useEffect } from 'react';
import Context from './context';
import useDispatch from './hooks/use-dispatch';
import useSelector from './hooks/use-selector';
import View from './components/view';
import Loading from './components/loading';
import { lang } from './config';

export default () => {
	const dispatch = useDispatch();

	useEffect(() => {
		dispatch({
			type: 'doc/get',
		});
	}, []);

	const doc = useSelector((state) => state.doc);
	const loadingState = useSelector((state) => state.loading['doc/get']);

	if (loadingState !== false) return <Loading />;

	return (
		<Context.Provider value={{ lang }}>
			<View content={doc.value} />
		</Context.Provider>
	);
};
