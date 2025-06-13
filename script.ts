import os from 'os'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import { getActiveAppName } from './get-active-app'
import { CYAN, GRAY, GREEN, RESET, YELLOW } from './ansi_colors'

// Get own local IP
const own = Object.values(os.networkInterfaces())
  .flat()
  .find((iface) => iface?.family === 'IPv4' && !iface.internal)?.address
console.log("This device's local IP is:", YELLOW + own, RESET)
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

const time = () =>
  GRAY +
  new Date().toLocaleTimeString().replace(' AM', 'a').replace(' PM', 'p') +
  RESET

const tellVLC = async (
  ip: string,
  command: string,
  key: string
): Promise<void> => {
  const url = `http://${ip}:8080/requests/status.xml?command=${command}`
  const who = ip === own ? `${YELLOW} self${RESET}` : `${CYAN}other${RESET}`
  try {
    const response = await fetch(url, headers)
    if (response.ok)
      console.log(`${time()}   ${key.padEnd(3)} ${who}  ${command}`)
    else console.error(`error tellVLC ${who} response: ${response.status}`)
  } catch (error) {
    console.error(`error tellVLC ${who}: ${error}`)
  }
}
const v = new GlobalKeyboardListener()

// Set process.env.FOLLOWER_ONLY = 'true' to disable this computer from controlling the other one.
const follower_only = process.env.FOLLOWER_ONLY === 'true'
if (follower_only)
  console.log(
    `Follower-only mode: 👀 ON. Use ${GREEN}shift${RESET} to control both.\n`
  )

const commands = {
  SPACE: ['pl_pause', , '␣'],
  'LEFT ARROW': ['seek&val=-10s', , '←'],
  'RIGHT ARROW': ['seek&val=+10s', , '→'],
  BACKTICK: ['seek&val=', other, '`'], // sync other to own
  FN: ['seek&val=', own, 'fn'], // sync own to other
  'UP ARROW': ['volume&val=+5', other, '↑'], // Increase other volume
  'DOWN ARROW': ['volume&val=-5', other, '↓'], // Decrease other volume
}

// Our event listeners
v.addListener(function (e, down) {
  ;(async function () {
    if ((await getActiveAppName()) !== 'VLC') return

    if (e.state !== 'DOWN') return
    const foundCommand = commands[e.name ?? '']
    const shiftPressed = !!(down['RIGHT SHIFT'] || down['LEFT SHIFT'])

    if (foundCommand) {
      const [command, target, keyNickname = e.name] = foundCommand

      if (command.startsWith('volume')) {
        // Volume commands require shift
        if (shiftPressed) tellVLC(target, command, keyNickname)
      } else if (target) {
        // Sync commands (w/ a specific target) have unique logic
        const { time } = await getVLCStatus(target === own ? other : own)
        const offsetTime = time + (target === own ? 1 : 0)
        tellVLC(target, command + offsetTime, keyNickname)
      } else {
        // Pause / Go back / Go forward
        if (!follower_only || shiftPressed) {
          tellVLC(other, command, keyNickname)
          if (shiftPressed) tellVLC(own, command, keyNickname)
        }
      }
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
