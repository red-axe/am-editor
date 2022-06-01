const { NODE_ENV } = process.env;
const fs = require('fs');
const { join } = require('path');

const isDev = NODE_ENV !== 'production';
const configPath = join(__dirname, `../config/${isDev ? 'dev' : 'prod'}.json`);
const configString = fs.readFileSync(`${configPath}`, 'utf-8');

const getConfig = () => {
	let config = {};
	try {
		config = JSON.parse(configString);
	} catch (error) {
		console.log(error);
	}
	return config;
};

const getConfigDB = () => {
	const config = getConfig();
	return config.mongodb;
};

const getCollectionName = () => {
	const config = getConfig();
	return config.collectionName || 'aomao';
};

module.exports = {
	getConfig,
	getConfigDB,
	getCollectionName,
};
