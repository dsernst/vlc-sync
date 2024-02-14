import { GlobalKeyboardListener } from 'node-global-key-listener'
import { getActiveAppName } from './get-active-app'

const vlcPassword = 'your_vlc_password' // VLC HTTP interface password

// IPs of both laptops
const own = '192.168.4.30'
const other = '192.168.4.58'

// Auth for VLC's http interface
const base64Credentials = Buffer.from(`:${vlcPassword}`).toString('base64')
const authHeader = `Basic ${base64Credentials}`
const headers = { headers: { Authorization: authHeader }, method: 'GET' }

const getVLCStatus = async () => {
  const url = `http://${own}:8080/requests/status.json`
  try {
    const response = await fetch(url, headers)
    if (response.ok) {
      return response.json()
    } else {
      console.error(`error getVLCStatus: response status ${response.status}`)
    }
  } catch (error) {
    console.error(`error getVLCStatus: ${error}`)
  }
}

const tellOtherVLC = async (command: string): Promise<void> => {
  const ip = other
  const url = `http://${ip}:8080/requests/status.xml?command=${command}`
  try {
    const response = await fetch(url, headers)
    if (response.ok) {
      console.log(`To ${ip}: ${command}`)
    } else {
      console.error(`error tellOtherVLC ${ip}: response ${response.status}`)
    }
  } catch (error) {
    console.error(`error tellOtherVLC ${ip}: ${error}`)
  }
}
const v = new GlobalKeyboardListener()

// Our event listeners
v.addListener(async function (e, down) {
  if ((await getActiveAppName()) !== 'VLC') return

  if (e.state !== 'DOWN') return
  switch (e.name) {
    // Pause
    case 'SPACE':
      tellOtherVLC('pl_pause')
      break
    // Seek back 10s
    case 'LEFT ARROW':
      tellOtherVLC('seek&val=-10s')
      break
    // Seek fwd 10s
    case 'RIGHT ARROW':
      tellOtherVLC('seek&val=+10s')
      break
    // Sync up other clients to this one
    case 'BACKTICK': // hotkey for ~, need to check for shift too
      if (down['RIGHT SHIFT'] || down['LEFT SHIFT']) {
        const { time } = await getVLCStatus()
        tellOtherVLC(`seek&val=${time}`)
      }
  }
})

// Log every key that's pressed
// v.addListener((e, down) =>
//   console.log(
//     `${e.name} ${e.state}`
//     // , ${Object.keys(down).filter((k) => down[k])}`
//   )
// )

// Log errors
new GlobalKeyboardListener({
  mac: { onError: (errorCode) => console.error('ERROR: ' + errorCode) },
})

// Keep the script running
setInterval(() => {}, 100000)

console.log('Listening to keep VLCs in sync with each other...\n')
