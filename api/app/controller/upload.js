const fs = require('fs');
const path = require('path');
const sendToWormhole = require('stream-wormhole');
const ffmpeg = require('fluent-ffmpeg');
const { Controller } = require('egg');
const os = require('os');

class UploadController extends Controller {
	constructor(cxt) {
		super(cxt);
		this.domain = this.config.domain.replace(
			'{port}',
			this.config.cluster.listen.port,
		);
	}
	async image() {
		const { ctx, app } = this;
		//获取图片地址
		const { url } = ctx.request.body;
		let stream;
		//如果地址存在就下载图片
		if (!!url) {
			const result = await this.ctx.curl(url, {
				streaming: true,
			});
			stream = result.res;
			//通过url获取文件名称
			stream.filename = url.split('/').pop();
		} else {
			//获取文件流
			stream = await ctx.getFileStream();
		}

		//图片名称
		const sourceName = stream.filename;
		const ext = sourceName.substr(sourceName.lastIndexOf('.'));
		const fileName = new Date().getTime() + '-image' + ext; // stream对象也包含了文件名，大小等基本信息

		// 创建文件写入路径
		const filePath = path.join(
			app.baseDir,
			`/app/public/upload/${fileName}`,
		);

		const result = await new Promise((resolve, reject) => {
			// 创建文件写入流
			const remoteFileStrem = fs.createWriteStream(filePath);
			// 以管道方式写入流
			stream.pipe(remoteFileStrem);

			let errFlag;
			// 监听error事件
			remoteFileStrem.on('error', (err) => {
				errFlag = true;
				// 停止写入
				sendToWormhole(stream);
				remoteFileStrem.destroy();
				console.log(err);
				reject(err);
			});
			const url = `${this.domain}/upload/${fileName}`;
			// 监听写入完成事件
			remoteFileStrem.on('finish', () => {
				if (errFlag) return;
				resolve({
					url,
				});
			});
		});

		ctx.body = { code: 200, message: '', data: result };
	}

	async file() {
		const { ctx, app } = this;
		//获取文件流
		const stream = await ctx.getFileStream();
		//文件名称
		const sourceName = stream.filename;
		const ext = sourceName.substr(sourceName.lastIndexOf('.'));
		const fileName = new Date().getTime() + '-file' + ext; // stream对象也包含了文件名，大小等基本信息
		// 创建文件写入路径
		const filePath = path.join(
			app.baseDir,
			`/app/public/upload/${fileName}`,
		);

		const result = await new Promise((resolve, reject) => {
			// 创建文件写入流
			const remoteFileStrem = fs.createWriteStream(filePath);
			// 以管道方式写入流
			stream.pipe(remoteFileStrem);

			let errFlag;
			// 监听error事件
			remoteFileStrem.on('error', (err) => {
				errFlag = true;
				// 停止写入
				sendToWormhole(stream);
				remoteFileStrem.destroy();
				console.log(err);
				reject(err);
			});
			const url = `${this.domain}/upload/${fileName}`;
			// 监听写入完成事件
			remoteFileStrem.on('finish', () => {
				if (errFlag) return;
				resolve({
					url,
					preview:
						[
							'.jpg',
							'.png',
							'.gif',
							'.pdf',
							'.txt',
							'.html',
							'.htm',
						].indexOf(ext) >= 0
							? url
							: '',
					download: url,
				});
			});
		});

		ctx.body = { code: 200, message: '', data: result };
	}

	async video() {
		const { ctx, app } = this;
		//获取文件流
		const stream = await ctx.getFileStream();
		//文件名称
		const sourceName = stream.filename;
		const ext = sourceName.substr(sourceName.lastIndexOf('.'));
		const fileName = new Date().getTime() + '-video' + ext; // stream对象也包含了文件名，大小等基本信息
		// 创建文件写入路径
		const filePath = path.join(
			app.baseDir,
			`/app/public/upload/${fileName}`,
		);

		const result = await new Promise((resolve, reject) => {
			// 创建文件写入流
			const remoteFileStrem = fs.createWriteStream(filePath);
			// 以管道方式写入流
			stream.pipe(remoteFileStrem);

			let errFlag;
			// 监听error事件
			remoteFileStrem.on('error', (err) => {
				errFlag = true;
				// 停止写入
				sendToWormhole(stream);
				remoteFileStrem.destroy();
				console.log(err);
				reject(err);
			});
			const url = `${this.domain}/upload/${fileName}`;
			// 监听写入完成事件
			remoteFileStrem.on('finish', () => {
				if (errFlag) return;
				const result = {
					url,
					download: url,
					name: sourceName,
				};
				try {
					const platform = os.platform();
					const osDir = platform === 'linux' ? 'linux' : 'win';
					ffmpeg.setFfmpegPath(
						path.join(
							app.baseDir,
							`./app/ffmpeg/${osDir}/ffmpeg${
								osDir === 'win' ? '.exe' : ''
							}`,
						),
					);
					const probePath = path.join(
						app.baseDir,
						`./app/ffmpeg/${osDir}/ffprobe${
							osDir === 'win' ? '.exe' : ''
						}`,
					);
					ffmpeg.setFfprobePath(probePath);
					ffmpeg.ffprobe(filePath, (err, metadata) => {
						const fileName = new Date().getTime() + '-v-image.png'; // stream对象也包含了文件名，大小等基本信息

						// 创建文件写入路径
						const imagePath = path.join(
							app.baseDir,
							`/app/public/upload/${fileName}`,
						);

						if (err) {
							console.error(err);
							reject(err);
							return;
						} else {
							const { width, height } = metadata.streams[0];
							result.width = width;
							result.height = height;
							ffmpeg(filePath)
								.screenshots({
									timestamps: ['50%'],
									filename: fileName,
									folder: path.join(
										app.baseDir,
										'/app/public/upload',
									),
								})
								.on('end', () => {
									result.cover = `${this.domain}/upload/${fileName}`;
									resolve(result);
								});
						}
					});
				} catch (err) {
					console.error(err);
					result.message = err.message;
					resolve(result);
				}
			});
		});

		ctx.body = { code: 200, message: '', data: result };
	}

	async videoQuery() {
		const { ctx, app } = this;

		const { id } = ctx.request.body;
		const result = await new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve({
					id,
					//url
				});
			}, 5000);
		});
		ctx.body = { code: 200, message: '', data: result };
	}
}

module.exports = UploadController;
