import { FC, MouseEvent } from 'react';
import React, { useContext } from 'react';
import { context, Link, NavLink } from 'dumi/theme';
import LocaleSelect from './LocaleSelect';
import './Navbar.less';

interface INavbarProps {
	location: any;
	navPrefix?: React.ReactNode;
	navSuffix?: React.ReactNode;
	navLast?: React.ReactNode;
	onMobileMenuClick: (ev: MouseEvent<HTMLButtonElement>) => void;
}

const Navbar: FC<INavbarProps> = ({
	onMobileMenuClick,
	navPrefix,
	navSuffix,
	navLast,
	location,
}) => {
	const {
		base,
		config: { mode, title, logo },
		nav: navItems,
	} = useContext(context);

	return (
		<div className="__dumi-default-navbar" data-mode={mode}>
			{/* menu toogle button (only for mobile) */}
			<button
				className="__dumi-default-navbar-toggle"
				onClick={onMobileMenuClick}
			/>
			{/* logo & title */}
			<Link
				className="__dumi-default-navbar-logo"
				style={{
					backgroundImage: logo && `url('${logo}')`,
				}}
				to={base}
				data-plaintext={logo === false || undefined}
			>
				{title}
			</Link>
			<nav>
				{navPrefix}
				{/* nav */}
				{navItems.map((nav) => {
					const child = Boolean(nav.children?.length) && (
						<ul>
							{nav.children.map((item) => (
								<li key={item.path}>
									<NavLink to={item.path}>
										{item.title}
									</NavLink>
								</li>
							))}
						</ul>
					);

					return (
						<span key={nav.title || nav.path}>
							{nav.path ? (
								<NavLink
									isActive={(match, location) => {
										if (
											match &&
											(match.url === '' ||
												match.url === '/')
										) {
											return (
												'' === location.pathname ||
												'/' === location.pathname
											);
										}
										return (
											match &&
											location.pathname.indexOf(
												match.url,
											) === 0
										);
									}}
									to={nav.path}
									key={nav.path}
								>
									{nav.title}
									{nav.path.includes('editablejs') && (
										<span
											style={{
												position: 'absolute',
												right: '-10px',
												top: '-4px',
											}}
										>
											<svg
												viewBox="0 0 1024 1024"
												version="1.1"
												xmlns="http://www.w3.org/2000/svg"
												p-id="7464"
												width="32"
												height="32"
											>
												<path
													d="M889.6 272l-758.4 0c-41.6 0-73.6 32-73.6 73.6l0 361.6c0 41.6 32 73.6 73.6 73.6l758.4 0c41.6 0 73.6-32 73.6-73.6l0-361.6C963.2 304 931.2 272 889.6 272zM320 646.4l-51.2 0-99.2-195.2 0 195.2-32 0 0-233.6 44.8 0 102.4 201.6 3.2 0 0-201.6 32 0L320 646.4zM400 512l124.8 0 0 32-124.8 0c0 3.2 0 3.2 0 6.4l0 0c0 41.6 12.8 60.8 38.4 60.8l89.6 0 0 32-89.6 0c-19.2 0-35.2-6.4-48-22.4-12.8-16-19.2-41.6-19.2-70.4 0-12.8 0-28.8 0-54.4 0-54.4 35.2-76.8 70.4-83.2l0 0c12.8 0 80 0 86.4 0l0 32c-28.8 0-73.6 0-83.2 0-12.8 3.2-41.6 12.8-41.6 51.2C400 502.4 400 505.6 400 512zM816 646.4l-44.8 0-44.8-185.6-51.2 185.6-48 0-67.2-233.6 35.2 0 57.6 192 3.2 0 51.2-192 38.4 0 51.2 201.6 60.8-201.6 32 0L816 646.4z"
													fill="#44b492"
												></path>
											</svg>
										</span>
									)}
								</NavLink>
							) : (
								nav.title
							)}
							{child}
						</span>
					);
				})}
				{navSuffix}
				<LocaleSelect location={location} />
			</nav>
			<div id="am-editor-ot-members"></div>
			{navLast}
		</div>
	);
};

export default Navbar;
