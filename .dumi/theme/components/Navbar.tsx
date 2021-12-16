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
