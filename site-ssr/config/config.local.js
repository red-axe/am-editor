'use strict';

const os = require('os');
//获取本机ip
function getIpAddress() {
	/**os.networkInterfaces() 返回一个对象，该对象包含已分配了网络地址的网络接口 */
	var interfaces = os.networkInterfaces();
	for (var devName in interfaces) {
		var iface = interfaces[devName];
		for (var i = 0; i < iface.length; i++) {
			var alias = iface[i];
			if (
				alias.family === 'IPv4' &&
				alias.address !== '127.0.0.1' &&
				!alias.internal
			) {
				return alias.address;
			}
		}
	}
}
const localHost = getIpAddress();

module.exports = (appInfo) => {
	const config = (exports = {});
	config.domain = `http://${localHost}:{port}`;
	config.umiServerPath = '../../../docs-dist/umi.server';
	config.logger = {
		level: 'NONE',
		consoleLevel: 'DEBUG',
	};
	config.assets = {
		devServer: {
			debug: true,
			autoPort: true,
		},
		dynamicLocalIP: false,
	};
	return config;
};
