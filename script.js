const { uIOhook: iohook } = require('uiohook-napi')
const axios = require('axios')

const vlcPassword = 'your_vlc_password' // VLC HTTP interface password
const ips = ['192.168.1.2', '192.168.1.3'] // IPs of both laptops
const auth = { auth: { username: '', password: vlcPassword } } // VLC's web interface uses a blank username

const sendCommandToVLC = async (command) => {
  ips.forEach((ip) => {
    const url = `http://${ip}:8080/requests/status.xml?command=${command}`
    axios
      .get(url, auth)
      .then(() => console.log(`Command ${command} sent to VLC at ${ip}`))
      .catch((error) =>
        console.error(`Failed to send command to VLC at ${ip}: ${error}`)
      )
  })
}

// Define key codes for space, left arrow, and right arrow
const SPACEBAR_KEYCODE = 57
const LEFT_ARROW_KEYCODE = 105
const RIGHT_ARROW_KEYCODE = 106

iohook.on('keydown', (event) => {
  switch (event.keycode) {
    case SPACEBAR_KEYCODE:
      sendCommandToVLC('pl_pause')
      break
    case LEFT_ARROW_KEYCODE:
      sendCommandToVLC('seek&val=-10s')
      break
    case RIGHT_ARROW_KEYCODE:
      sendCommandToVLC('seek&val=+10s')
      break
  }
})

iohook.start()
