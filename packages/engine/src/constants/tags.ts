import { toMap } from '../utils';

export const BLOCK_TAG_MAP = toMap(
  'html,head,body,h1,h2,h3,h4,h5,h6,p,div,pre,blockquote,hr,ul,ol,li,table,thead,tbody,colgroup,col,tr,td,th,video,iframe',
);
export const INLINE_TAG_MAP = toMap('a,br,img');
export const MARK_TAG_MAP = toMap(
  'b,strong,i,em,u,del,s,strike,code,mark,span,sub,sup',
);
export const VOID_TAG_MAP = toMap('br,hr,img,col,anchor,focus,cursor');
export const SOLID_TAG_MAP = toMap(
  'table,thead,tbody,colgroup,col,tr,td,th,ul,ol,li',
);
export const HEADING_TAG_MAP = toMap('h1,h2,h3,h4,h5,h6,p');
export const TITLE_TAG_MAP = toMap('h1,h2,h3,h4,h5,h6');
export const ROOT_TAG_MAP = toMap('h1,h2,h3,h4,h5,h6,p,blockquote,ul,ol');
export const TABLE_TAG_MAP = toMap('table,thead,tbody,tr,td,th');

export const MARK_ELEMENTID_MAP = toMap('p,ol,ul,li,h1,h2,h3,h4,h5,h6');
