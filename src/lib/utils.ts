export const randomIdentifier = () => {
  // all alphanumeric characters, upper and lower case and _ and -
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  // 10 characters long
  const length = 10;
  // generate lenght number of random characters from the characters string
  const randomCharacters = Array(length)
    .fill('')
    .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
    .join('');
  return randomCharacters;
};
