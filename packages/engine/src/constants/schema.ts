export default [
  'p',
  'br',
  {
    p: {
      'data-id': '*',
    },
  },
  {
    img: {
      src: '@url',
      width: '@number',
      height: '@number',
      style: {
        width: '@length',
        height: '@length',
      },
    },
  },
  {
    a: {
      href: '@url',
      target: ['_blank', '_parent', '_top'],
    },
  },
];
