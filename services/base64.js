module.exports = (file) => {
    const base64 = file.buffer.toString('base64')
    const image = 'data:image/png;base64,' + base64
    return image
}