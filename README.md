# vlc-sync
Keep two VLC players in sync during pause, seek forward/back etc.

----

You can create a Node.js script to listen for keyboard events and send commands to VLC on both laptops. 

VLC Media Player includes a feature called VLC HTTP interface, which can be used to control VLC remotely. This interface allows you to send commands to VLC via HTTP requests, making it possible to play, pause, seek, and perform other actions from a remote application or script.

Here's a high-level overview of how you can set up a custom synchronization solution:

### Step 1: Enable the HTTP Interface in VLC

First, ensure that the HTTP interface is enabled on both instances of VLC.

1. Open VLC.
2. Go to **Tools > Preferences** (or **VLC > Preferences** on Mac).
3. Show settings: **All**.
4. Under **Interface**, select **Main interfaces** and ensure that the **Web** checkbox is checked.
5. Expand the **Main interfaces** option and select **Lua**.
6. Set the **Lua HTTP**. Password to something you'll remember (this is required for remote control).

### Step 2: Determine the IP Address of Both Laptops

Find out the IP addresses of both computers on your local network. This is needed to send commands to VLC from one device to another.

### Step 3: Create a Synchronization Script

First, ensure you have Node.js installed on your system, then install the required packages using npm:

```bash
npm install iohook axios
```

Here's how you could write the script in Node.js:

```javascript
const iohook = require('iohook')
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
```

This script listens for spacebar, left arrow, and right arrow key presses to control play/pause and seek operations on VLC. It sends the commands to both VLC instances running on the specified IP addresses.

### Notes:

- Make sure you replace `'your_vlc_password'` with the actual password you've set for the VLC HTTP interface.
- Update the IP addresses (`'192.168.1.2'`, `'192.168.1.3'`) to match those of your two deviced.
- This script uses global key hooks, which means it will respond to these keys regardless of which application is currently focused. Be mindful of this when running the script.
- Ensure VLC is configured correctly on both laptops to accept commands via its HTTP interface, as described in the previous VLC setup steps.

This Node.js script offers a flexible and efficient way to synchronize video playback controls across multiple devices, utilizing familiar keyboard shortcuts.
