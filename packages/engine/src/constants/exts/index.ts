import CODE_EXT from './code';
import IMAGE_EXT from './image';
import MAC_OFFICE_EXT from './mac-office';
import OFFICE_EXT from './ms-office';
import FILE_EXT from './file';

const VIDEO_EXT = ['mp4'];

const TEXT_FILE_EXT = ['txt', 'md'].concat(CODE_EXT);

const join = (exts: Array<string>) => {
  return exts
    .map(function(ext) {
      return '.'.concat(ext);
    })
    .join(', ');
};

export default {
  File: FILE_EXT,
  FileString: join(FILE_EXT),
  Image: IMAGE_EXT,
  ImageString: join(IMAGE_EXT),
  Video: VIDEO_EXT,
  VideoString: join(VIDEO_EXT),
  Office: OFFICE_EXT,
  OfficeString: join(OFFICE_EXT),
  MacOffice: MAC_OFFICE_EXT,
  MacOfficeString: join(MAC_OFFICE_EXT),
  Text: TEXT_FILE_EXT,
};
