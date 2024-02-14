import { getActiveAppName } from './get-active-app'

const vlcPassword = 'your_vlc_password' // VLC HTTP interface password

// IPs of both laptops
const ips = ['192.168.4.30', '192.168.4.58']

// Auth for VLC's http interface
const base64Credentials = Buffer.from(`:${vlcPassword}`).toString('base64')
const authHeader = `Basic ${base64Credentials}`

const sendCommandToVLC = async (command: string): Promise<void> => {
  ips.forEach(async (ip) => {
    const url = `http://${ip}:8080/requests/status.xml?command=${command}`
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: authHeader,
        },
        method: 'GET',
      })
      if (response.ok) {
        console.log(`Command ${command} sent to ${ip}`)
      } else {
        console.error(
          `Failed to send command to VLC at ${ip}: Received non-OK response status ${response.status}`
        )
      }
    } catch (error) {
      console.error(`Failed to send command to VLC at ${ip}: ${error}`)
    }
  })
}
const { GlobalKeyboardListener } = require('node-global-key-listener')
const v = new GlobalKeyboardListener()

// Our event listeners
v.addListener(async function (e: { state: string; name: string }) {
  if ((await getActiveAppName()) !== 'VLC') return

  if (e.state !== 'DOWN') return
  switch (e.name) {
    case 'SPACE':
      sendCommandToVLC('pl_pause')
      break
    case 'LEFT ARROW':
      sendCommandToVLC('seek&val=-10s')
      break
    case 'RIGHT ARROW':
      sendCommandToVLC('seek&val=+10s')
      break
  }
})

// Log every key that's pressed
// v.addListener((e) => console.log(`${e.name} ${e.state}`))

// Log errors
new GlobalKeyboardListener({
  mac: { onError: (errorCode) => console.error('ERROR: ' + errorCode) },
})

// Keep the script running
setInterval(() => {}, 100000)

console.log('Listening to keep VLCs in sync with each other...\n')
