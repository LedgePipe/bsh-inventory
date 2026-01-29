// Professional hospitality messages for BSH Inventory

export const ralphQuotes = {
  login: [
    "Welcome to BSH Inventory",
    "Ready to manage your stock",
    "Let's keep things running smoothly",
    "Your inventory awaits",
  ],
  welcome: [
    "Signed in successfully!",
    "Welcome back!",
    "Good to see you!",
    "Ready to go!",
  ],
  lowStock: [
    "Time to reorder",
    "Stock is running low",
    "Consider restocking soon",
    "Below par level",
  ],
  success: [
    "Done!",
    "Got it!",
    "Updated successfully",
    "Changes saved",
  ],
  delete: [
    "Item removed",
    "Successfully deleted",
    "Removed from inventory",
    "Deleted",
  ],
  error: [
    "Something went wrong",
    "Please try again",
    "Unable to complete",
    "There was an issue",
  ],
  loading: [
    "Loading inventory...",
    "Fetching data...",
    "Just a moment...",
    "Getting everything ready...",
  ]
}

export function getRandomQuote(category: keyof typeof ralphQuotes): string {
  const quotes = ralphQuotes[category]
  return quotes[Math.floor(Math.random() * quotes.length)]
}
