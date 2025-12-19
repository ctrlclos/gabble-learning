// Create an AbortController for timeout handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

const response = await fetch(url, {
  method: 'POST',
  signal: controller.signal // Allow us to cancel the request
});

clearTimeout(timeoutId); // Clear the timeout if request completed
