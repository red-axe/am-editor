import { createContext } from 'react';

type Props = {
	lang: string;
};

export default createContext<Props>({
	lang: 'en-US',
});
