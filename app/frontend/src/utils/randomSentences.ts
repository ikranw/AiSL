// Unity sentence pool — only uses words confirmed in SignController.cs:
// HELLO, MY, YOU, THIS, WHICH, PLEASE, TAKE, AND, OR, COME,
// BOOK, COFFEE, CLASS, BAG, CAMERA, BANANA, BABY, CHILD, DAD,
// ANCIENT, ALIEN, ANY, BAD, BALANCE, DANGER, FUTURE, EVERYONE,
// APPLE, ARRIVE, ASK, BAKE, BALL, BANK, BOTH, BRING, CAMP, EQUAL
// (ANGEL excluded — animation not ready)
export const UNITY_RANDOM_SENTENCES = [
  'Hello, everyone in class.',
  'Please take this book to class.',
  'My dad has an ancient camera.',
  'Please bring this bag to class.',
  'Any child can bring a book.',
  'This ancient book belongs to my dad.',
  'My baby has a banana and an apple.',
  'Ask my dad which class is this.',
  'This alien looks ancient.',
  'The danger is bad for everyone.',
  'Please bake this for my child.',
  'Which coffee is for you and me?',
  'The future is equal for everyone.',
] as const;

// Video sentence pool — only uses words confirmed as .mp4 files in /public/signs/:
// I, YOU, MY, WE, HELLO, PLEASE, SORRY, THANK YOU, WANT, NEED, HAVE, KNOW,
// GOOD, BAD, HAPPY, SAD, TIRED, HUNGRY, SICK, LOVE, UNDERSTAND,
// BOOK, COFFEE, FOOD, WATER, HOME, SCHOOL, CLASS, WORK, STUDY,
// GO, COME, SEE, EAT, DRINK, SLEEP, WALK, RUN, SIT, STAND, HELP,
// MOM, DAD, FAMILY, FRIEND, TEACHER, STUDENT, DOCTOR,
// TODAY, TOMORROW, YESTERDAY, TIME, MUSIC, MOVIE, GAME, PHONE
export const VIDEO_RANDOM_SENTENCES = [
  'I want to go to school today.',
  'Please help me, I do not understand.',
  'I am happy today.',
  'I am tired and hungry.',
  'My family is at home.',
  'I love my mom and dad.',
  'I want to eat food and drink water.',
  'My friend is a good student.',
  'I need to study for class tomorrow.',
  'Do you want to play a game today?',
  'I am sick, I need a doctor.',
  'I know my teacher is good.',
  'We go home after school.',
  'I want to watch a movie tonight.',
  'Please sit down and read this book.',
  'I am sorry, I do not know.',
  'Thank you, I understand now.',
  'I want to listen to music today.',
  'My work is done, I want to sleep.',
  'Yesterday I was sad, today I am happy.',
] as const;

export const RANDOM_SENTENCES = UNITY_RANDOM_SENTENCES;
