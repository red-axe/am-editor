import React from 'react';
import Avatar from 'antd/es/avatar';
import Space from 'antd/es/space';
import { isMobile } from '@aomao/engine';
import OTClient, { STATUS, EVENT } from './client';
import type { Member, ERROR } from './types';
import 'antd/es/avatar/style';
import 'antd/es/space/style';
import 'antd/es/badge/style';
import 'antd/es/tooltip/style';
import { Popover, Tooltip } from 'antd';

const maxCount = isMobile ? 2 : 5;
const OTComponent: React.FC<{ members: Member[] }> = ({ members }) => {
	const renderList = () => {
		if (!maxCount) return;
		const moreMembers: Member[] = [];
		for (let i = maxCount; i < members.length; i++) {
			moreMembers.push(members[i]);
		}
		return (
			<div style={{ maxHeight: 'calc(60vh)', overflowY: 'scroll' }}>
				{moreMembers.map(({ uuid, name, color }) => (
					<div
						key={uuid}
						style={{
							display: 'flex',
							alignItems: 'center',
							marginBottom: 4,
						}}
					>
						<Avatar size={24} style={{ backgroundColor: color }}>
							{name}
						</Avatar>
						<span style={{ marginLeft: '4px' }}>{name}</span>
					</div>
				))}
			</div>
		);
	};

	const renderMore = () => {
		if (maxCount && members.length > maxCount) {
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
							+{members.length - maxCount}
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
				{members.map((member, index) => {
					if (maxCount && index >= maxCount) return;
					return (
						<Tooltip key={member.uuid} title={member.name}>
							<Avatar
								size={isMobile ? 24 : 30}
								style={{ backgroundColor: member.color }}
							>
								{member['name']}
							</Avatar>
						</Tooltip>
					);
				})}
				{renderMore()}
			</Space>
		</div>
	);
};
export { OTClient, STATUS, EVENT };
export type { Member, ERROR };
export default OTComponent;
