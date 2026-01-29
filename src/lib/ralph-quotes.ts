// Ralph Wiggum Quotes for every occasion!

export const ralphQuotes = {
  login: [
    "Hi, Super Nintendo Chalmers! I'm learnding to count bottles!",
    "My cat's breath smells like cat food!",
    "I'm Idaho!",
    "Me fail inventory? That's unpossible!",
    "The doctor said I wouldn't have so many nosebleeds if I kept my finger outta there!"
  ],
  welcome: [
    "Hi! I'm helping with the bottles!",
    "I bent my wookie... but the inventory is fine!",
    "My brain is telling my fingers to count!",
    "I'm learnding inventory management!"
  ],
  lowStock: [
    "Uh oh! These bottles need more friends!",
    "It's lonely in here! Need more bottles!",
    "My tummy hurts... I mean, the stock is low!",
    "Tastes like we need to order more!"
  ],
  success: [
    "I did it! I'm a helper!",
    "Go banana! I mean... it's saved!",
    "My brain did a good job!",
    "I'm special! And so is this inventory!"
  ],
  delete: [
    "Bye bye, bottle friend!",
    "That bottle moved to a farm upstate!",
    "My cat took it... probably.",
    "It's in a better place now!"
  ],
  error: [
    "Uh oh! My brain hurts!",
    "That tickles in a bad way!",
    "Something went wrong... like that time I ate a crayon!",
    "The computer is being mean to me!"
  ],
  loading: [
    "My brain is loading...",
    "I'm thinking with my head!",
    "The little wheel is spinning!",
    "Almost there... I can count to potato!"
  ]
}

export function getRandomQuote(category: keyof typeof ralphQuotes): string {
  const quotes = ralphQuotes[category]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
