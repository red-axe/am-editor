const path = require('path');
module.exports = (appInfo, appConfig = {}) => {
	const assetsDir = (appConfig.assets && appConfig.assets.assetsDir) || '../';
	const config = (exports = {});

	// use for cookie sign key, should change to your own and keep security
	config.keys = appInfo.name + '_1513765449219_5858';
	config.domain = 'https://editor.aomao.com';
	config.umiServerPath = '../public/umi.server';
	// add your config here
	config.middleware = [];
	const files =
		'.docx, .doc, .dotx, .dot, .rtf, .txt, .html, .htm, .pdf, .xls, .xlsx, .xltx, .xlsm, .xlt, .csv, .pptx, .ppt, .potx, .pot, .ppsx, .pps, .pages, .numbers, .nmbtemplate, .template, .key, .keynote, .kth, .et, .ett, .dps, .dpt, .wps, .wpt, .txt, .md, .mark, .markdown, .xmind, .graffle, .gtemplate, .gstencil, .mindnode, .vpp, .mmap, .mpp, .svg, .png, .bmp, .jpg, .jpeg, .gif, .tif, .tiff, .emf, .webp, .sketch, .psd, .ai, .rp, .rplib, .aep, .c4d, .fbx, .xd, .ai, .mp4, .mp3, .zip, .rar, .gz, .tgz, .gzip, .7z, .tar, .abap, .ada, .adp, .ahk, .as, .as3, .asc, .ascx, .asm, .asp, .awk, .bash, .bash_login, .bash_logout, .bash_profile, .bashrc, .bat, .bib, .bsh, .build, .builder, .c, .c++, .capfile, .cc, .cfc, .cfm, .cfml, .cl, .clj, .cls, .cmake, .cmd, .coffee, .config, .cpp, .cpt, .cpy, .cs, .cshtml, .cson, .csproj, .css, .ctp, .cxx, .dart, .d, .ddl, .di, .diff, .disco, .dml, .dtd, .dtml, .el, .emakefile, .erb, .erl, .f, .f90, .f95, .fs, .fsi, .fsscript, .fsx, .gemfile, .gemspec, .gitconfig, .go, .groovy, .gvy, .Hcp, .h, .h++, .haml, .handlebars, .hbs, .hh, .hpp, .hrl, .hs, .htc, .hxx, .html, .htm, .idl, .iim, .inc, .inf, .ini, .inl, .ipp, .irbrc, .pug, .jade, .jav, .java, .js, .json, .jsp, .jsx, .l, .less, .lhs, .lisp, .log, .lst, .ltx, .lua, .m, .mak, .make, .manifest, .master, .md, .markdn, .markdown, .mdown, .mkdn, .ml, .mli, .mll, .mly, .mm, .mud, .makefile, .nfo, .opml, .osascript, .p, .pas, .patch, .php, .php2, .php3, .php4, .php5, .phtml, .pl, .plx, .perl, .pm, .pod, .pp, .profile, .ps1, .ps1xml, .psd1, .psm1, .pss, .pt, .py, .pyw, .proto, .r, .rake, .rb, .rbx, .rc, .rdf, .re, .reg, .rest, .resw, .resx, .rhtml, .rjs, .rprofile, .rpy, .rs, .rss, .rst, .ruby, .rxml, .s, .sass, .scala, .scm, .sconscript, .sconstruct, .script, .scss, .sgml, .sh, .shtml, .sml, .svn-base, .swift, .sql, .sty, .tcl, .tex, .textile, .tld, .tli, .tmpl, .tpl, .ts, .tsx, .vb, .vi, .vim, .vmg, .webpart, .wsp, .wsdl, .xhtml, .xml, .xoml, .xsd, .xslt, .yaml, .yaws, .yml, .zsh';
	config.multipart = {
		fileSize: '20mb',
		whitelist: files.split(',').map((name) => name.trim()),
	};
	config.static = {
		prefix: '/',
		dir: path.join(appInfo.baseDir, 'app/public'),
		// support lazy load
		dynamic: true,
		preload: false,
		buffer: false,
		maxFiles: 1000,
	};
	config.view = {
		mapping: {
			'.html': 'nunjucks',
		},
		defaultViewEngine: 'nunjucks',
	};

	config.proxy = true;

	config.security = {
		csrf: {
			enable: false,
			ignoreJSON: true,
		},
		domainWhiteList: ['*'],
		xframe: {
			enable: false,
		},
	};

	config.cors = {
		origin: '*',
		allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
	};

	return config;
};
