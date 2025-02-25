const { _electron: electron } = require('playwright')
const path = require('path')

;(async () => {
    try {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../main.js')],
        })

        const appPath = await electronApp.evaluate(async ({ app }) => {
            return app.getAppPath()
        })
        console.log('App path:', appPath)

        const window = await electronApp.firstWindow()

        console.log('Window title:', await window.title())

        await window.screenshot({ path: 'noter-app-screenshot.png' })

        window.on('console', console.log)

        await new Promise((resolve) => setTimeout(resolve, 3000))

        await electronApp.close()

        console.log('Test completed successfully!')
    } catch (error) {
        console.error('Test failed:', error)
        process.exit(1)
    }
})()
