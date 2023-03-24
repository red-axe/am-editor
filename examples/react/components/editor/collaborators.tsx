import React from 'react';
import Avatar from 'antd/es/avatar';
import Space from 'antd/es/space';
import { CursorData } from '@aomao/plugin-yjs';
import { isMobile } from '@aomao/engine';
import 'antd/es/avatar/style/css';
import 'antd/es/space/style/css';
import 'antd/es/badge/style/css';
import 'antd/es/tooltip/style/css';
import { Popover, Tooltip } from 'antd';

const maxCount = isMobile ? 2 : 5;
export const Collaboration: React.FC<{ members: Record<number, CursorData> }> =
	({ members }) => {
		const count = Object.keys(members).length;
		const renderList = () => {
			if (!maxCount) return;
			const moreMembers: CursorData[] = [];
			let count = 0;
			for (const key in members) {
				if (count >= maxCount) break;
				moreMembers.push(members[key]);
				count++;
			}

			return (
				<div style={{ maxHeight: 'calc(60vh)', overflowY: 'scroll' }}>
					{moreMembers.map(({ name, color, avatar }, index) => (
						<div
							key={index}
							style={{
								display: 'flex',
								alignItems: 'center',
								marginBottom: 4,
							}}
						>
							<Avatar
								size={24}
								style={{ backgroundColor: color }}
								src={avatar}
							>
								{name}
							</Avatar>
							<span style={{ marginLeft: '4px' }}>{name}</span>
						</div>
					))}
				</div>
			);
		};

		const renderMore = () => {
			if (maxCount && count > maxCount) {
				return (
					<Popover
						content={renderList()}
						placement="bottomLeft"
						overlayClassName="editor-ot-more-popover"
						trigger={isMobile ? 'click' : 'hover'}
					>
						<div className="editor-ot-more-button">
							<Avatar
								style={{ backgroundColor: '#dbdbdb' }}
								size={isMobile ? 24 : 30}
							>
								+{count - maxCount}
							</Avatar>
						</div>
					</Popover>
				);
			}
			return;
		};

		return (
			<div className="editor-ot-users">
				<Space className="editor-ot-users-content" size="small">
					{Object.values(members).map(
						({ name, color, avatar }, index) => {
							if (maxCount && index >= maxCount) return;
							return (
								<Tooltip key={index} title={name}>
									<Avatar
										size={isMobile ? 24 : 30}
										style={{ backgroundColor: color }}
										src={avatar}
									>
										{name}
									</Avatar>
								</Tooltip>
							);
						},
					)}
					{renderMore()}
				</Space>
			</div>
		);
	};
