import { $ } from 'bun'
import { CYAN, GRAY, YELLOW, RESET } from './ansi_colors'

const TIMEOUT = 500
const { OTHER_DEVICE_NAME, OTHER_IP } = process.env

if (!OTHER_DEVICE_NAME) {
  console.error('process.env.OTHER_DEVICE_NAME not set')
  process.exit(1)
}

async function getIp() {
  const pingResponse = await $`ping -c 1 -W ${TIMEOUT} ${OTHER_DEVICE_NAME}`
    .text()
    .catch(() => {
      // No network response
      console.log(
        `Timeout ${GRAY}${TIMEOUT}ms\n  ${YELLOW}${OTHER_DEVICE_NAME} ${GRAY}$OTHER_DEVICE_NAME${RESET} \n  404 NOT FOUND on network`
      )
      process.exit(1)
    })

  // If success, parse the IP from the ping response
  const firstLine = pingResponse.split('\n')[0]
  const ip = firstLine.split('(')[1].split(')')[0]
  return ip
}

const otherIp = await getIp()
console.log(
  `Found other (${OTHER_DEVICE_NAME}) at:\n  ${CYAN}${otherIp}${RESET}`
)

if (OTHER_IP !== otherIp)
  console.log(
    `\n⚠️  Mismatch: .env.local $OTHER_IP=\n  ${YELLOW}${OTHER_IP}${RESET}`
  )
else console.log('✅ .env.local $OTHER_IP set correctly')
