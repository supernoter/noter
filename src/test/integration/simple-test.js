const { _electron: electron } = require('playwright')
const path = require('path')

;(async () => {
    try {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js'), '--no-intro'],
        })

        const window = await electronApp.firstWindow()

        await window.waitForLoadState('domcontentloaded')

        console.log('Window title:', await window.title())

        await window.keyboard.type(
            'This is a test note written by Playwright automation!'
        )

        await window.keyboard.press('Enter')
        await window.keyboard.press('Enter')
        await window.keyboard.type('# Heading 1')
        await window.keyboard.press('Enter')
        await window.keyboard.type('## Heading 2')
        await window.keyboard.press('Enter')
        await window.keyboard.press('Enter')
        await window.keyboard.type('- Bullet point 1')
        await window.keyboard.press('Enter')
        await window.keyboard.type('- Bullet point 2')
        await window.keyboard.press('Enter')
        await window.keyboard.press('Enter')
        await window.keyboard.type('**Bold text** and *italic text*')

        await window.waitForTimeout(1000)

        await window.screenshot({ path: 'noter-testrun-0000.png' })

        // Optional: If you need to click a save button
        // await window.click('button.save-note');

        // Wait a moment before closing
        await window.waitForTimeout(2000)

        // Exit app
        await electronApp.close()

        console.log('Test completed successfully!')
    } catch (error) {
        console.error('Test failed:', error)
        process.exit(1)
    }
})()
