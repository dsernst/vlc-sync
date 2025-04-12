import os from 'os'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import { getActiveAppName } from './get-active-app'

// Get own local IP
const own = Object.values(os.networkInterfaces())
  .flat()
  .find((iface) => iface?.family === 'IPv4' && !iface.internal)?.address
console.log("This device's local IP is:", own)
if (!own) {
  console.error("ERROR: Could not find this device's local IP")
  process.exit(1)
}

const vlcPassword = process.env.VLC_PASSWORD
if (!vlcPassword) throw new Error('process.env.VLC_PASSWORD not set')

// IP of other device
const other = process.env.OTHER_IP || '192.168.4.115'

// Auth for VLC's http interface
const base64Credentials = Buffer.from(`:${vlcPassword}`).toString('base64')
const authHeader = `Basic ${base64Credentials}`
const headers = { headers: { Authorization: authHeader }, method: 'GET' }

const getVLCStatus = async (ip: string) => {
  const url = `http://${ip}:8080/requests/status.json`
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

const tellVLC = async (ip: string, command: string): Promise<void> => {
  const url = `http://${ip}:8080/requests/status.xml?command=${command}`
  try {
    const response = await fetch(url, headers)
    if (response.ok) {
      console.log(`Told ${ip === own ? 'self' : 'other'}: ${command}`)
    } else {
      console.error(`error tellVLC ${ip}: response ${response.status}`)
    }
  } catch (error) {
    console.error(`error tellVLC ${ip}: ${error}`)
  }
}
const v = new GlobalKeyboardListener()

// Set process.env.FOLLOWER_ONLY = 'true' to disable this computer from controlling the other one.
const follower_only = process.env.FOLLOWER_ONLY === 'true'
if (follower_only) console.log('Follower-only mode: 👀 ACTIVATED\n')

// Our event listeners
v.addListener(function (e, down) {
  ;(async function () {
    if ((await getActiveAppName()) !== 'VLC') return

    if (e.state !== 'DOWN') return
    switch (e.name) {
      // Pause
      case 'SPACE':
        if (!follower_only) tellVLC(other, 'pl_pause')
        break
      // Seek back 10s
      case 'LEFT ARROW':
        if (!follower_only) tellVLC(other, 'seek&val=-10s')
        break
      // Seek fwd 10s
      case 'RIGHT ARROW':
        if (!follower_only) tellVLC(other, 'seek&val=+10s')
        break
      // Sync up other clients to this one
      case 'BACKTICK':
        // for ~ (w/ shift): push other computer to this one
        if (down['RIGHT SHIFT'] || down['LEFT SHIFT']) {
          const { time } = await getVLCStatus(own)
          if (!follower_only) tellVLC(other, `seek&val=${time}`)
        } else {
          // for ` (w/o shift): sync this computer to other one
          const { time } = await getVLCStatus(other)
          tellVLC(own, `seek&val=${time + 1}`)
        }
        break
    }
  })()
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
