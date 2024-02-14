export const getActiveAppName = async () => {
  const proc = Bun.spawn([
    'osascript',
    '-e',
    'tell application "System Events" to get the name of the first process whose frontmost is true',
  ])
  const text = await new Response(proc.stdout).text()
  // console.log('Active App Name:', text.trim())
  return text.trim()
}
