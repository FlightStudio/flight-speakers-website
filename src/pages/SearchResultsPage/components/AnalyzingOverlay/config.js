export const ORB_LAYERS = [
  {
    color: "#ffcf3e",
    animate: {
      rotate: [0, 360],
      opacity: [0.9, 1, 0.9]
    },
    transition: {
      rotate:  { duration: 50, repeat: Infinity, ease: 'linear' },
      opacity: { duration: 6,  repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    color: "#d451ff",
    animate: {
      rotate: [60, -300],
      opacity: [0.8, 0.95, 0.8]
    },
    transition: {
      rotate:  { duration: 45, repeat: Infinity, ease: 'linear' },
      opacity: { duration: 8,  repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    color: "#ff2951",
    animate: {
      rotate: [120, -240],
      opacity: [0.85, 1, 0.85]
    },
    transition: {
      rotate:  { duration: 60, repeat: Infinity, ease: 'linear' },
      opacity: { duration: 5,  repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    color: "#ff7933",
    animate: {
      rotate: [200, 560],
      opacity: [0.75, 0.9, 0.75]
    },
    transition: {
      rotate:  { duration: 40, repeat: Infinity, ease: 'linear' },
      opacity: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    color: "#2ec66f",
    animate: {
      rotate: [300, -60],
      opacity: [0.88, 1, 0.88]
    },
    transition: {
      rotate:  { duration: 55, repeat: Infinity, ease: 'linear' },
      opacity: { duration: 7,  repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    color: "#519bff",
    animate: {
      rotate: [30, 390],
      opacity: [0.7, 0.85, 0.7]
    },
    transition: {
      rotate:  { duration: 70, repeat: Infinity, ease: 'linear' },
      opacity: { duration: 9,  repeat: Infinity, ease: 'easeInOut' },
    },
  },
];

export const analyzingMessages = [
  'Reading your brief',
  'Understanding your audience',
  'Identifying key themes',
  'Scanning speaker profiles',
  'Matching speaker expertise',
  'Reviewing past talks',
  'Weighing audience fit',
  'Checking availability',
  'Ranking best fits',
  'Curating your shortlist',
];

export const analyzingMessagesDelay = 3_000;
