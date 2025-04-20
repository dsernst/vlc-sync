import find from 'local-devices'

console.log('Starting local-devices search, will take a minute...')
await find().then((devices) => {
  devices.forEach((device) => {
    console.log(`IP: ${device.ip}, MAC: ${device.mac}, Name: ${device.name}`)
  })
})
