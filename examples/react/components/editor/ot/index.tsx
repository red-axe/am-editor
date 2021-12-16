import React from 'react';
import Avatar from 'antd/es/avatar';
import Space from 'antd/es/space';
import { isMobile } from '@aomao/engine';
import OTClient, { STATUS, EVENT } from './client';
import type { Member, ERROR } from './client';
import 'antd/es/avatar/style';
import 'antd/es/space/style';

const OTComponent: React.FC<{ members: Array<Member> }> = ({ members }) => {
	return (
		<div className="editor-ot-users">
			<Space className="editor-ot-users-content" size="small">
				{members.map((member) => {
					return (
						<Avatar
							key={member['id']}
							size={isMobile ? 24 : 30}
							style={{ backgroundColor: member['color'] }}
						>
							{member['name']}
						</Avatar>
					);
				})}
			</Space>
		</div>
	);
};
export { OTClient, STATUS, EVENT };
export type { Member, ERROR };
export default OTComponent;
