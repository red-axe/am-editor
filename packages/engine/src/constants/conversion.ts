export default [
  ['b', 'strong'],
  [
    {
      span: {
        style: {
          'font-weight': ['bold', '700'],
        },
      },
    },
    'strong',
  ],
  ['i', 'em'],
  [
    {
      span: {
        style: {
          'font-style': 'italic',
        },
      },
    },
    'em',
  ],
  [
    {
      span: {
        style: {
          'text-decoration': 'underline',
        },
      },
    },
    'u',
  ],
  ['s', 'del'],
  ['strike', 'del'],
  [
    {
      span: {
        style: {
          'text-decoration': 'line-through',
        },
      },
    },
    'del',
  ],
  ['th', 'td'],
];
