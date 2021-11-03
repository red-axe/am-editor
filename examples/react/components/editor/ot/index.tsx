import React, { useContext } from 'react';
import Avatar from 'antd/es/avatar';
import Space from 'antd/es/space';
import { isMobile } from '@aomao/engine';
import OTClient, { STATUS, EVENT } from './client';
import Context from '../../../context';
import type { Member, ERROR } from './client';
import 'antd/es/avatar/style';
import 'antd/es/space/style';

const OTComponent: React.FC<{ members: Array<Member> }> = ({ members }) => {
	const { lang } = useContext(Context);

	return (
		<div className="editor-ot-users">
			<Space className="editor-ot-users-content" size="small">
				{!isMobile && (
					<span style={{ color: '#888888' }}>
						{lang === 'zh-CN' ? (
							<>
								当前在线<strong>{members.length}</strong>人
							</>
						) : (
							<>
								<strong>{members.length}</strong> person online
							</>
						)}
					</span>
				)}
				{members.map((member) => {
					return (
						<Avatar
							key={member['id']}
							size={isMobile ? 18 : 24}
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
