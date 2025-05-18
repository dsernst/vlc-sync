import { $ } from 'bun'
import { CYAN, RESET } from './ansi_colors'

const { OTHER_DEVICE_NAME } = process.env

async function getIp(deviceName: string) {
  const pingResponse = await $`ping -c 1 ${deviceName}`.text()
  const firstLine = pingResponse.split('\n')[0]
  const ip = firstLine.split('(')[1].split(')')[0]
  return ip
}

if (!OTHER_DEVICE_NAME) {
  console.error('process.env.OTHER_DEVICE_NAME not set')
  process.exit(1)
}

const otherIp = await getIp(OTHER_DEVICE_NAME)
console.log(`Found other (${OTHER_DEVICE_NAME}) at: ${CYAN}${otherIp}${RESET}`)
