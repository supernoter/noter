// Electron app check get and set content.
const { _electron: electron } = require('playwright')
const path = require('path')
const assert = require('assert')

;(async () => {
    try {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js'), '--no-intro'],
        })
        const window = await electronApp.firstWindow()
        await window.waitForLoadState('domcontentloaded')
        // Test getContent.
        const msg0 = `Hello World! This is now the editor content`
        await window.keyboard.type(msg0)
        let result = await window.evaluate(async () => {
            return window.api.getContent()
        })
        assert(result == msg0, 'content typed differs from content retrieved')
        // Test setContent
        const msg1 = `OK`
        result = await window.evaluate(async () => {
            window.api.setContent(`OK`)
            return window.api.getContent()
        })
        assert(result == msg1, 'content set differs from content retrieved')
        await window.waitForTimeout(1000)
        await electronApp.close()
        console.log('✅ [content] test completed successfully!')
    } catch (error) {
        console.error('test failed:', error)
        process.exit(1)
    }
})()
